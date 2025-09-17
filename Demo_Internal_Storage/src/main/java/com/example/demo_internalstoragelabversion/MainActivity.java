package com.example.demo_internalstoragelabversion;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.io.FileOutputStream;

public class MainActivity extends AppCompatActivity {
    private TextView tv_language;
    private EditText et_name;
    private RadioButton rb_male , rb_female;
    private CheckBox cb_cpp , cb_java , cb_python;
    private Button btn_submit;
    private FileOutputStream fos;
    private Intent intent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });
        TextView tv_gender;
        tv_gender = findViewById(R.id.tv_gender);
        tv_language = findViewById(R.id.tv_language);

        et_name = findViewById(R.id.et_name);

        rb_male = findViewById(R.id.rb_male);
        rb_female = findViewById(R.id.rb_female);

        cb_cpp = findViewById(R.id.cb_cpp);
        cb_java = findViewById(R.id.cb_java);
        cb_python = findViewById(R.id.cb_python);

        btn_submit = findViewById(R.id.btn_submit);

        btn_submit.setOnClickListener(v -> {
            String name = et_name.getText().toString();
            String gender = "";
            StringBuffer language = new StringBuffer();
            if(name.isEmpty()){
                Toast.makeText(this, "Plz Select Name..", Toast.LENGTH_SHORT).show();
            }
           else if(!rb_male.isChecked() && !rb_female.isChecked()){
                Toast.makeText(this, "Plz Select Gender..", Toast.LENGTH_SHORT).show();
            }
           else if(!cb_cpp.isChecked() && !cb_java.isChecked() && !cb_python.isChecked()) {
                Toast.makeText(this, "Plz Select Language..", Toast.LENGTH_SHORT).show();
            }

           else{
               if(rb_male.isChecked()){
                   gender = rb_male.getText().toString();
               }
               else{
                   gender = rb_female.getText().toString();
               }

               if(cb_cpp.isChecked()){
                   language.append(cb_cpp.getText().toString() + ",");
               }
               if(cb_java.isChecked()){
                   language.append(cb_java.getText().toString() + ",");
               }
               if(cb_python.isChecked()){
                   language.append(cb_python.getText().toString());
               }

               try {
                   fos = openFileOutput("data.txt", MODE_PRIVATE);
                   fos.write(name.toString().getBytes());
                   fos.write("\n".getBytes());
                   fos.write(gender.toString().getBytes());
                   fos.write("\n".getBytes());
                   fos.write(language.toString().getBytes());
                   fos.close();

                   Toast.makeText(this, "Data Saved", Toast.LENGTH_SHORT).show();

                   intent = new Intent(MainActivity.this, SecondActivity.class);
                   startActivity(intent);

               }catch (Exception e){
                   e.printStackTrace();
               }
           }
        });

    }
}