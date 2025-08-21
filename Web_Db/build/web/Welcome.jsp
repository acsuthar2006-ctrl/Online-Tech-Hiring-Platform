<%-- 
    Document   : Welcome.jsp
    Created on : 17 Aug 2025, 7:06:52?pm
    Author     : aarya_suthar
--%>

<!DOCTYPE html>
<html>
<head>
    <title>Welcome Page</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f2f2f2; text-align: center; padding: 50px; }
        .card { background: white; padding: 20px; border-radius: 10px; width: 400px; margin: auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        h2 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Welcome, ${name}</h2>
        <p><b>Email:</b> ${email}</p>
        <p><b>City:</b> ${city}</p>
    </div>
</body>
</html>
