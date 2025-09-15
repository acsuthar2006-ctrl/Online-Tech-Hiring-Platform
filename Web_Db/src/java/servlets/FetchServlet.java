/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */
package servlets;

import jakarta.servlet.RequestDispatcher;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

/**
 *
 * @author aarya_suthar
 */
public class FetchServlet extends HttpServlet {

    /**
     * Processes requests for both HTTP <code>GET</code> and <code>POST</code>
     * methods.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        try (PrintWriter out = response.getWriter()) {
            /* TODO output your page here. You may use following sample code. */
            out.println("<!DOCTYPE html>");
            out.println("<html>");
            out.println("<head>");
            out.println("<title>Servlet FetchServlet</title>");
            out.println("</head>");
            out.println("<body>");
            out.println("<h1>Servlet FetchServlet at " + request.getContextPath() + "</h1>");
            out.println("</body>");
            out.println("</html>");
        }
    }

    // <editor-fold defaultstate="collapsed" desc="HttpServlet methods. Click on the + sign on the left to edit the code.">
    /**
     * Handles the HTTP <code>GET</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    public FetchServlet() {
        System.out.println("FetchServlet constructor called");
    }
    @Override
    public void init() throws ServletException {
        super.init();
        System.out.println("FetchServlet initialized");
        // Initialization code here
    }
    @Override
    public void service(HttpServletRequest req, HttpServletResponse res)
            throws ServletException, IOException {
        System.out.println("FetchServlet service method called");
        super.service(req, res);
    }
    @Override
    public void destroy() {
        // Cleanup code here
        System.out.println("FetchServlet destroyed");
        super.destroy();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    /**
     * Handles the HTTP <code>POST</code> method.
     *
     * @param request servlet request
     * @param response servlet response
     * @throws ServletException if a servlet-specific error occurs
     * @throws IOException if an I/O error occurs
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("text/html");
        PrintWriter out = response.getWriter();

        String idStr = request.getParameter("id");
        
        

        try {
            int id = Integer.parseInt(idStr);

            Class.forName("org.apache.derby.client.ClientAutoloadedDriver");

          
            Connection con = DriverManager.getConnection(
                    "jdbc:derby://localhost:1527/users", "arya", "arya");

            String query = "SELECT * FROM users_detail WHERE id = ?";
            PreparedStatement ps = con.prepareStatement(query);
            ps.setInt(1, id);
            

            ResultSet rs = ps.executeQuery();
            HttpSession session = request.getSession();
            System.out.println(session.getId());
            System.out.println(session.getClass().getName());
            
//            response.encodeURL("details.jsp");
            
            if (rs.next()) {
                
                session.setAttribute("id", rs.getInt("id"));
                session.setAttribute("name", rs.getString("name"));
                session.setAttribute("email", rs.getString("email"));
                session.setAttribute("city", rs.getString("city"));
                request.setAttribute("name", "Aarya");
                
                RequestDispatcher rd = request.getRequestDispatcher("details.jsp");
                rd.forward(request, response);
//                out.println("<h2>User Details</h2>");
//                out.println("<table border='1' cellpadding='8' style='border-collapse: collapse;'>");
//                
//                out.println("<tr><th>ID</th><th>Name</th><th>Email</th><th>City</th></tr>");
//                out.println("<tr>");
//                out.println("<td>" + rs.getInt("id") + "</td>");
//                out.println("<td>" + rs.getString("name") + "</td>");
//                out.println("<td>" + rs.getString("email") + "</td>");
//                out.println("<td>" + rs.getString("city") + "</td>");
//                out.println("</tr>");
//                out.println("<form action='WelcomeServlet' method='post'>");
//                out.println("<input type='submit' value='Go to Welcome'>");
//                out.println("</form>");
//                out.println("</body>");
//                out.println("</html>");               
//                out.println("</table>");

               
            } else {
//                out.println("<h2>No user found with ID: " + id + "</h2>");
                response.sendRedirect("registration.html");
            }
            
            
//            RequestDispatcher rd = request.getRequestDispatcher("details.jsp");
//            rd.forward(request, response);
               
            rs.close();
            ps.close();
            con.close();

        } catch (NumberFormatException e) {
            out.println("<h2>Error: Invalid ID format</h2>");
        } catch (Exception e) {
            out.println("<h2>Error: " + e.getMessage() + "</h2>");
        }
    }

    /**
     * Returns a short description of the servlet.
     *
     * @return a String containing servlet description
     */
    @Override
    public String getServletInfo() {
        return "Short description";
    }// </editor-fold>

}
