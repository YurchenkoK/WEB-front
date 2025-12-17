from rest_framework import serializers
from drugs_estimation.models import Drug, EstimationRequest, DrugInEstimation
from collections import OrderedDict


class DrugSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Drug
        fields = ["id", "name", "description", "concentration", "volume", "image_url"]
        read_only_fields = ['id', 'image_url']
    
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
    """Детальный сериализатор с информацией о препарате"""
    drug_id = serializers.IntegerField(source='drug.id', read_only=True)
    drug_name = serializers.CharField(source='drug.name', read_only=True)
    
    class Meta:
        model = DrugInEstimation
        fields = [
            'id',
            'drug_id',
            'drug_name',
            'ampoule_volume',
            'infusion_speed',
        ]
        read_only_fields = ['id', 'drug_id', 'drug_name']


class EstimationRequestSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    
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
            'items'
        ]
        read_only_fields = ['id', 'doctor', 'laboratory_worker', 'status', 'creation_datetime', 'formation_datetime', 'completion_datetime']
    
    def get_items(self, obj):
        """Возвращает массив ID препаратов в заявке"""
        return list(obj.items.values_list('drug_id', flat=True))


class EstimationRequestListSerializer(serializers.ModelSerializer):
    """Serializer for estimation request list view — excludes item details to keep list compact."""
    async_results_count = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()
    
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
            'async_results_count',
            'items'
        ]
        read_only_fields = ['id', 'doctor', 'laboratory_worker', 'status', 'creation_datetime', 'formation_datetime', 'completion_datetime']
    
    def get_async_results_count(self, obj):
        """Возвращает количество DrugInEstimation с заполненной скоростью введения (infusion_speed)"""
        from decimal import Decimal
        return obj.items.filter(infusion_speed__isnull=False).exclude(infusion_speed=Decimal('0')).count()
    
    def get_items(self, obj):
        """Возвращает массив ID препаратов в заявке"""
        return list(obj.items.values_list('drug_id', flat=True))


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
