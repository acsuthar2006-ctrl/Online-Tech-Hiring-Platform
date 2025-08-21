/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.mycompany.logistics;

/**
 *
 * @author aarya_suthar
 */
public class Logistics {
    
    public static void main(String[] args) {
        System.out.println("\n");
        
        Transport t1 = LogisticsFactory.createTransport("TRUCK");
        t1.deliver();
        
        
    }
}
