/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.canvas_abs;

/**
 *
 * @author aarya_suthar
 */
public class DisplayFriendlyFactory implements ShapeFactory {

    @Override
    public Shape getShape(String type) {
        if(type.equalsIgnoreCase("circle"))
            return new DisplayFriendlyCircle();
        else
            return new DisplayFriendlyRect();
        
    }
    
}
