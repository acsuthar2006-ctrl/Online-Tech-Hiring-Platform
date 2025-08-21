package com.mycompany.customer;


import com.mycompany.customer.CubicalWatermelon;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author aarya_suthar
 */
public class CubicalFruitFactory {
    public static Fruit getFruit(String type){
        if(type.equalsIgnoreCase("watermelon"))
            return new CubicalWatermelon();
        else if (type.equalsIgnoreCase("banana"))
            return new CubicalBanana();
        return null;
    }
}
