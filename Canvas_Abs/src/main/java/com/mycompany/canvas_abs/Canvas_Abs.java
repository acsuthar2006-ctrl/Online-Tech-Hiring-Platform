/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.mycompany.canvas_abs;

import java.util.ArrayList;
import java.util.Iterator;

/**
 *
 * @author aarya_suthar
 */
public class Canvas_Abs {
    private ArrayList<Shape> shapeList =new ArrayList<>();
    
    public void addShape(String shapeType,String objectType){
       Shape shape = null;
       if(objectType.equalsIgnoreCase("DisplayFriendly")){
           shape = new DisplayFriendlyFactory().getShape(shapeType);
       }
       else if (objectType.equalsIgnoreCase("PrinterFriendly")){
           shape = new PrinterFriendlyFactory().getShape(shapeType);
       }
      shapeList.add(shape);
    }
    
    public void reDraw(){
        Iterator<Shape> it = shapeList.iterator();
        while(it.hasNext()){
            Shape shape = it.next();
            shape.draw();
        }
    }
    
    public static void main(String[] args) {
        System.out.println("\n");
        
        Canvas_Abs c = new Canvas_Abs();
        c.addShape("circle", "DisplayFriendly");
        c.addShape("CIRCLE", "PRINTERFRIENDLY");
        c.addShape("rectangle", "displayfriendly");
        c.addShape("rectangle", "printerfriendly");
        
       c.reDraw();
    }
}
