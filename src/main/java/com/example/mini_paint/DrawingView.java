package com.example.mini_paint;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.NonNull;

import java.util.ArrayList;
import java.util.List;

public class DrawingView extends View {

    // Enum for drawing modes
    public enum ShapeMode { FREEHAND, LINE, RECTANGLE, CIRCLE }
    private ShapeMode currentMode = ShapeMode.FREEHAND;

    private Paint paint;              // single paint reused
    private Path currentPath;
    private List<Shape> shapes = new ArrayList<>();

    // For line/rect/circle
    private float startX, startY, endX, endY;
    private boolean isDrawing = false;

    // Current paint settings (for new shapes)
    private int currentColor = Color.BLACK;
    private float currentStrokeWidth = 8f;

    public DrawingView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        paint = new Paint();
        paint.setColor(currentColor);
        paint.setStrokeWidth(currentStrokeWidth);
        paint.setStyle(Paint.Style.STROKE);
        paint.setAntiAlias(true);
    }

    // Shape container
    private static class Shape {
       final ShapeMode mode;
       final Path path;
       final float sx, sy, ex, ey;
       final int color;
       final float strokeWidth;

        Shape(ShapeMode mode, Path path, float sx, float sy, float ex, float ey,
              int color, float strokeWidth) {
            this.mode = mode;
            this.path = path;
            this.sx = sx;
            this.sy = sy;
            this.ex = ex;
            this.ey = ey;
            this.color = color;
            this.strokeWidth = strokeWidth;
        }
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        // Draw all saved shapes
        for (Shape s : shapes) {
            drawShape(canvas, s);
        }

        // Draw current shape (preview only, not saved yet)
        if (isDrawing) {
            @SuppressLint("DrawAllocation")
            Shape preview = new Shape(currentMode, currentPath, startX, startY, endX, endY,
                    currentColor, currentStrokeWidth);
            drawShape(canvas, preview);
        }
    }

    private void drawShape(Canvas canvas, Shape s) {
        // Reuse the same paint, just update settings
        paint.setColor(s.color);
        paint.setStrokeWidth(s.strokeWidth);

        switch (s.mode) {
            case FREEHAND:
                if (s.path != null) canvas.drawPath(s.path, paint);
                break;
            case LINE:
                canvas.drawLine(s.sx, s.sy, s.ex, s.ey, paint);
                break;
            case RECTANGLE:
                canvas.drawRect(s.sx, s.sy, s.ex, s.ey, paint);
                break;
            case CIRCLE:
                RectF rect = new RectF(s.sx, s.sy, s.ex, s.ey);
                canvas.drawOval(rect, paint);
                break;
        }
    }

    @Override
    public boolean onTouchEvent(@NonNull MotionEvent event) {
        float x = event.getX();
        float y = event.getY();

        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                startX = x;
                startY = y;
                isDrawing = true;

                if (currentMode == ShapeMode.FREEHAND) {
                    currentPath = new Path();
                    currentPath.moveTo(x, y);
                }
                return true;

            case MotionEvent.ACTION_MOVE:
                endX = x;
                endY = y;

                if (currentMode == ShapeMode.FREEHAND && currentPath != null) {
                    currentPath.lineTo(x, y);
                }
                invalidate();
                break;

            case MotionEvent.ACTION_UP:
                endX = x;
                endY = y;
                isDrawing = false;

                if (currentMode == ShapeMode.FREEHAND) {
                    shapes.add(new Shape(currentMode, currentPath, 0, 0, 0, 0,
                            currentColor, currentStrokeWidth));
                } else {
                    shapes.add(new Shape(currentMode, null, startX, startY, endX, endY,
                            currentColor, currentStrokeWidth));
                }
                invalidate();
                break;
        }
        return true;
    }

    // Allow changing mode from Activity
    public void setMode(ShapeMode mode) {
        currentMode = mode;
    }

    public void setStrokeWidth(float width) {
        currentStrokeWidth = width;
    }

    public void setStrokeColor(int color) {
        currentColor = color;
    }
}