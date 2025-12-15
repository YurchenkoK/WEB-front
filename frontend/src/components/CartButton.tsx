import "./CartButton.css";
import { useCart } from "../CartContext";

interface CartButtonProps {
  orderId?: number; 
  count?: number;
}

export default function CartButton({ count }: CartButtonProps) {
  
  const { cart, fetchOnClick } = useCart();
  const usedCount = count ?? cart.count;

  const handleClick = async () => {
    
    try {
      await fetchOnClick();
    } catch (e) {
      
    }
  };

  return (
    <div className="cart-footer">
      <a
        href="#"
        className="cart-icon-link"
        onClick={(e) => {
          e.preventDefault();
          void handleClick();
        }}
      >
        <div className="icon-circle">
          <span className="microscope">🔬</span>
          {usedCount > 0 && <span className="cart-badge">{usedCount}</span>}
        </div>
      </a>
    </div>
  );
}
