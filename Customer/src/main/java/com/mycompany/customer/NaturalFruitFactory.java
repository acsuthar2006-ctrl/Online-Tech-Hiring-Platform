package com.mycompany.customer;


import com.mycompany.customer.NaturalWatermelon;

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */

/**
 *
 * @author aarya_suthar
 */
public class NaturalFruitFactory {
    public static Fruit getFruit(String type){
        if(type.equalsIgnoreCase("watermelon"))
            return new NaturalWatermelon();
        else if (type.equalsIgnoreCase("banana"))
            return new NaturalBanana();
        return null;
    }
}
