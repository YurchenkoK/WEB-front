from rest_framework import serializers
from drugs_estimation.models import Drug, EstimationRequest, DrugInEstimation
from collections import OrderedDict


class DrugSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Drug
        # Full serializer used for detail view and create/update
        fields = ["id", "name", "description", "concentration", "volume", "image_url"]
        read_only_fields = ['id', 'image_url']
    
    def get_image_url(self, obj):
        return obj.image_url if obj.image_url else None


class DrugListSerializer(serializers.ModelSerializer):
    """Serializer for the /api/drugs/ list endpoint — excludes 'volume' field."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Drug
        # place image_url right after name and exclude description for list endpoint
        fields = ["id", "name", "image_url", "concentration"]

    def get_image_url(self, obj):
        return obj.image_url if obj.image_url else None


class DrugInEstimationSerializer(serializers.ModelSerializer):
    drug = serializers.PrimaryKeyRelatedField(
        queryset=Drug.objects.filter(is_active=True)
    )
    estimation_request = serializers.PrimaryKeyRelatedField(
        queryset=EstimationRequest.objects.all()
    )
    
    class Meta:
        model = DrugInEstimation
        fields = [
            'id',
            'estimation_request',
            'drug',
            'ampoule_volume',
            'infusion_speed',
        ]
        read_only_fields = ['id']
    
    def update(self, instance, validated_data):
        validated_data.pop('drug', None)
        return super().update(instance, validated_data)


class DrugInEstimationDetailSerializer(serializers.ModelSerializer):
    """Сериализатор препарата в заявке для детального просмотра - все поля в одном уровне"""
    # ID препарата из связанной таблицы Drug
    drug_id = serializers.IntegerField(source='drug.id', read_only=True)
    
    # Основная информация о препарате из таблицы Drug
    name = serializers.CharField(source='drug.name', read_only=True)
    image_url = serializers.URLField(source='drug.image_url', read_only=True)
    # Данные из таблицы DrugInEstimation
    drug_in_estimation_id = serializers.IntegerField(source='id', read_only=True)  # ID записи в drug_in_estimation
    infusion_speed_rate = serializers.DecimalField(source='infusion_speed', max_digits=10, decimal_places=2, read_only=True)  # infusion_speed из drug_in_estimation
    ampoule_volume = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)  # ampoule_volume из drug_in_estimation
    
    class Meta:
        model = DrugInEstimation
        fields = [
            'drug_id',
            'name',
            'image_url',
            'drug_in_estimation_id',
            'infusion_speed_rate',
            'ampoule_volume',
        ]
    
    # removed is_delete field: not needed in many-to-many flattened output


class EstimationRequestSerializer(serializers.ModelSerializer):
    """Детальный сериализатор заявки - возвращает заявку с полным массивом препаратов в плоской структуре"""
    drugs_in_estimation = serializers.SerializerMethodField()
    
    class Meta:
        model = EstimationRequest
        fields = [
            'id',
            'doctor',
            'laboratory_worker',
            'status',
            'creation_datetime',
            'formation_datetime',
            'completion_datetime',
            'ampoules_count',
            'solvent_volume',
            'patient_weight',
            'drugs_in_estimation'
        ]
        read_only_fields = ['id', 'doctor', 'laboratory_worker', 'status', 'creation_datetime', 'formation_datetime', 'completion_datetime']
    
    def get_drugs_in_estimation(self, obj):
        """Возвращает массив препаратов с полной информацией в плоской структуре"""
        items = obj.items.select_related('drug').all()
        return DrugInEstimationDetailSerializer(items, many=True).data


class EstimationRequestListSerializer(serializers.ModelSerializer):
    """Serializer for estimation request list view — только поля заявки + счетчик посчитанных элементов."""
    drugs_in_estimation = serializers.SerializerMethodField()
    
    class Meta:
        model = EstimationRequest
        fields = [
            'id',
            'doctor',
            'laboratory_worker',
            'status',
            'creation_datetime',
            'formation_datetime',
            'completion_datetime',
            'ampoules_count',
            'solvent_volume',
            'patient_weight',
            'drugs_in_estimation'
        ]
        read_only_fields = ['id', 'doctor', 'laboratory_worker', 'status', 'creation_datetime', 'formation_datetime', 'completion_datetime']
    
    def get_drugs_in_estimation(self, obj):
        """Возвращает количество DrugInEstimation с заполненной скоростью введения (infusion_speed != null и != 0).
        Это поле в списочном сериализаторе содержит число завершённых расчётов для заявки.
        """
        from decimal import Decimal
        return obj.items.filter(infusion_speed__isnull=False).exclude(infusion_speed=Decimal('0')).count()


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    def update(self, instance, validated_data):
        """
        Update a user stored in Redis.
        `instance` is expected to be a dict returned by `redis_user_client.get_user_by_id`.
        """
        from drugs_estimation.redis_client import redis_user_client

        username = instance.get('username') if isinstance(instance, dict) else None
        if not username:
            # Nothing to update or unexpected instance shape — return as-is
            return instance

        # redis_user_client.update_user will ignore disallowed fields
        updated = redis_user_client.update_user(username, **validated_data)
        return updated
