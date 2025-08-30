import java.util.stream.Stream;
abstract class SuperDemo{
    SuperDemo(){
        System.out.println("SuperDemo constructor called");
    }
}
public class Demo extends SuperDemo{
    Demo(){
        System.out.println("Demo constructor called");
    }
    public static void main(String [] args){
        Demo demo = new Demo();
        // String str = "H";
        // System.out.println(str.hashCode());
        // str += "e";
        // System.out.println(str.hashCode());
        // try {
        //     System.out.println("Thread is sleeping for 5 seconds");
        //     Thread.sleep(5000);
        // } catch (InterruptedException e) {
        //     e.printStackTrace();
        // }

        // StringBuffer sb = new StringBuffer("H");
        // System.out.println(sb.hashCode());
        // sb.append("l");
        // System.out.println(sb.hashCode());
        

        // Stream<String> stream = Stream.of("H", "He", "Hel", "Hell", "Hello");
        // stream.forEach(s -> System.out.println(s.hashCode()));
        // System.out.println(stream.getClass().getName());
    }
    
}