/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.logistics;

/**
 *
 * @author aarya_suthar
 */
public class LogisticsFactory {
    
    public static Transport createTransport(String type) {
        if (type.equalsIgnoreCase("truck")) {
            return new Truck();
        } else if (type.equalsIgnoreCase("ship")) {
            return new Ship();
        } else if (type.equalsIgnoreCase("airplane")) {
            return new Airplane();
        }
        return null;
    }
}
