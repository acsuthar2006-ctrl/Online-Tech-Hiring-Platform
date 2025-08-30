interface BreadItem {
    double cost();
}
class Burger implements BreadItem {
   public double cost() {
       return 5.99;
   }
}
class Sandwich implements BreadItem {
   public double cost() {
       return 4.99;
   }
}
abstract class BreadItemDecorator implements BreadItem {
   protected BreadItem decoratedItem;

   public BreadItemDecorator(BreadItem item) {
       this.decoratedItem = item;
   }

   @Override
   public double cost() {
       return decoratedItem.cost();
   }
}
class CheeseDecorator extends BreadItemDecorator {
   public CheeseDecorator(BreadItem item) {
       super(item);
   }

   @Override
   public double cost() {
       return decoratedItem.cost() + 1.00;
   }
}
class LettuceDecorator extends BreadItemDecorator {
   public LettuceDecorator(BreadItem item) {
       super(item);
   }

   @Override
   public double cost() {
       return decoratedItem.cost() + 0.50;
   }
}

public class FoodTest {
    public static void main(String[] args) {
        BreadItem burger = new Burger();
        System.out.println("Normal Burger cost: " + burger.cost());

        BreadItem cheeseBurger = new CheeseDecorator(burger);
        System.out.println("Cheese Burger cost: " + cheeseBurger.cost());

        BreadItem lettuceCheeseBurger = new LettuceDecorator(cheeseBurger);
        System.out.println("Lettuce Cheese Burger cost: " + lettuceCheeseBurger.cost());

        
    }
}