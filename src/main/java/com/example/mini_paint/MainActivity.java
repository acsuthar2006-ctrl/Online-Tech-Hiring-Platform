package com.example.mini_paint;

import android.graphics.Color;
import android.os.Bundle;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

public class MainActivity extends AppCompatActivity {

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


       DrawingView drawingView = findViewById(R.id.drawingView);

        findViewById(R.id.btnFreehand).setOnClickListener(v ->
                drawingView.setMode(DrawingView.ShapeMode.FREEHAND));

        findViewById(R.id.btnLine).setOnClickListener(v ->
                drawingView.setMode(DrawingView.ShapeMode.LINE));

        findViewById(R.id.btnRect).setOnClickListener(v ->
                drawingView.setMode(DrawingView.ShapeMode.RECTANGLE));

        findViewById(R.id.btnCircle).setOnClickListener(v ->
                drawingView.setMode(DrawingView.ShapeMode.CIRCLE));

        findViewById(R.id.btnColorRed).setOnClickListener(v ->
                drawingView.setStrokeColor(Color.RED));
        findViewById(R.id.btnColorBlue).setOnClickListener(v ->
                drawingView.setStrokeColor(Color.BLUE));

        findViewById(R.id.btnThin).setOnClickListener(v ->
                drawingView.setStrokeWidth(5f));
        findViewById(R.id.btnThick).setOnClickListener(v ->
                drawingView.setStrokeWidth(15f));
    }
}