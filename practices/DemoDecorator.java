// Component
interface Coffee {
    String getDescription();
    double cost();
}

// Concrete Component
class SimpleCoffee implements Coffee {
    public String getDescription() {
        return "Simple Coffee";
    }
    public double cost() {
        return 5.0;
    }
}
class Cappuccino implements Coffee {
    public String getDescription() {
        return "Cappuccino";
    }
    public double cost() {
        return 6.0;
    }
}

// Decorator
abstract class CoffeeDecorator implements Coffee {
    protected Coffee coffee;
    public CoffeeDecorator(Coffee coffee) {
        this.coffee = coffee;
    }
}

// Concrete Decorators
class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) {
        super(coffee);
    }
    public String getDescription() {
        return coffee.getDescription() + ", Milk";
    }
    public double cost() {
        return coffee.cost() + 2.0;
    }
}

class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) {
        super(coffee);
    }
    public String getDescription() {
        return coffee.getDescription() + ", Sugar";
    }
    public double cost() {
        return coffee.cost() + 1.0;
    }
}

// Usage
public class DemoDecorator {
    public static void main(String[] args) {
        Coffee coffee = new SimpleCoffee();
        coffee = new MilkDecorator(coffee);
        coffee = new SugarDecorator(coffee);
        System.out.println(coffee.getDescription()); // Simple Coffee, Sugar
        System.out.println(coffee.cost()); // 6.0

        Coffee cappuccino = new Cappuccino();
        cappuccino = new MilkDecorator(cappuccino);
        cappuccino = new SugarDecorator(cappuccino);
        System.out.println(cappuccino.getDescription()); // Cappuccino, Milk, Sugar
        System.out.println(cappuccino.cost()); // 9.0   

    }
}