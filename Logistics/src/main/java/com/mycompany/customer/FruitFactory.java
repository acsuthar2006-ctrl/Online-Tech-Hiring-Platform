/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.customer;

import java.util.ArrayList;
import java.util.Iterator;

/**
 *
 * @author aarya_suthar
 */
public class FruitFactory {
    private ArrayList<Fruit> fruitList = new ArrayList<>();
    
    public void addFruit(String fruitType , String objectType){
        Fruit fruit = null;
        if(objectType.equalsIgnoreCase("NaturalFruitFactory"))
            fruit = NaturalFruitFactory.getFruit(fruitType);
        else if(objectType.equalsIgnoreCase("CubicalFruitFactory"))
            fruit = CubicalFruitFactory.getFruit(fruitType);
        
        fruitList.add(fruit);
    }
    
    public void reDraw(){
        Iterator it = fruitList.iterator();
        while(it.hasNext()){
            Fruit fruit = (Fruit) it.next();
            fruit.eat();
        }
    }
}
