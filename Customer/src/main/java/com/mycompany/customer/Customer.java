/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.mycompany.customer;

/**
 *
 * @author aarya_suthar
 */
public class Customer {

    public static void main(String[] args) {
        System.out.println("\n");
        
        FruitFactory ff = new FruitFactory();
        ff.addFruit("Banana", "NaturalFruitFactory");
        ff.addFruit("Watermelon", "CubicalFruitFactory");
        
        ff.reDraw();
    }
}
