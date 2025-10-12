package com.example.demo_smile;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.view.MotionEvent;
import android.view.View;

public class SmileView extends View {
    private Paint paint;
    private boolean isHappy = true;
    public SmileView(Context context) {
        super(context);
        intit();
    }
    public SmileView(Context context, android.util.AttributeSet attrs) {
        super(context, attrs);
        intit();
    }

    public void intit(){
        paint=new Paint();
        paint.setAntiAlias(true);
        paint.setStyle(Paint.Style.FILL);
        paint.setStrokeWidth(10);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        int height = getHeight();
        int width = getWidth();
        int radius = Math.min(height, width) / 2 ;

        paint.setColor(Color.YELLOW);
        canvas.drawCircle(width / 2, height / 2, radius, paint);

        int eyeY = height / 2 - radius / 3 ;
        int eyeX = radius / 3 ;
        paint.setColor(Color.BLACK);
        canvas.drawCircle(width / 2 - eyeX, eyeY, radius / 4, paint);
        canvas.drawCircle(width / 2 + eyeX, eyeY, radius / 4, paint);

        if (isHappy) {
            paint.setColor(Color.GREEN);
            canvas.drawArc(width / 2 - radius / 2,
                    height / 2 - radius / 4,
                    width / 2 + radius / 2,
                    height / 2 + radius / 2,
                    0, 180, false, paint);
        }
        else {
            paint.setColor(Color.RED);
            canvas.drawArc(width / 2 - radius / 2,
                    height / 2 ,
                    width / 2 + radius / 2,
                    height / 2 + radius / 2 + radius / 4,
                    0, -180, false, paint);
        }
    }


    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_DOWN) {
            isHappy = !isHappy;
            invalidate();
            return true;
        }
        return super.onTouchEvent(event);
    }

}
