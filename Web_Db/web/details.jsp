<%-- 
    Document   : details
    Created on : 17 Aug 2025, 7:10:20?pm
    Author     : aarya_suthar
--%>

<html>
<head>
    <title>User Details</title>
    <style>
        table {
            border-collapse: collapse;
            width: 60%;
            margin: 20px auto;
        }
        th, td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
        }
        th {
            background-color: #f2f2f2;
        }
        form {
            text-align: center;
            margin-top: 20px;
        }
        input[type=submit] {
            padding: 8px 16px;
            border: none;
            background-color: #4CAF50;
            color: white;
            border-radius: 4px;
            cursor: pointer;
        }
        input[type=submit]:hover {
            background-color: #45a049;
        }
    </style>
</head>
<body>

<h2 style="text-align:center;">User Details</h2>

<table>
    <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>City</th>
    </tr>
    <tr>
        <td>${sessionScope.id}</td>
        <td>${sessionScope.name}</td>
        <td>${sessionScope.email}</td>
        <td>${sessionScope.city}</td>
    </tr>
</table>

<form action="WelcomeServlet" method="post">
    <input type="submit" value="Go to Welcome">
</form>

</body>
</html>
