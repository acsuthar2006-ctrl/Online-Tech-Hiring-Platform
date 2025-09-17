package com.example.demo_internalstoragelabversion;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.io.FileInputStream;

public class SecondActivity extends AppCompatActivity {
    private TextView tv_name , tv_gender , tv_language;;
    private Button btn_back;
    private FileInputStream fis;
    private Intent intent;

    @SuppressLint("MissingInflatedId")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_second);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        tv_name = findViewById(R.id.tv_name);
        tv_gender = findViewById(R.id.tv_gender);
        tv_language = findViewById(R.id.tv_language);
        btn_back = findViewById(R.id.button);

        try {
            fis = openFileInput("data.txt");
            StringBuffer buffer = new StringBuffer();
            int i = -1;

            while ((i = fis.read()) != -1) {
                buffer.append((char) i);
            }
            String data[] = buffer.toString().split("\n");
            tv_name.setText("Name : " + data[0]);
            tv_gender.setText("Gender : " + data[1]);
            tv_language.setText("Language : " + data[2]);
            fis.close();

            btn_back.setOnClickListener(v -> {
                intent = new Intent(SecondActivity.this, MainActivity.class);
                startActivity(intent);
            });

        }catch (Exception e){
            e.printStackTrace();
        }

    }
}