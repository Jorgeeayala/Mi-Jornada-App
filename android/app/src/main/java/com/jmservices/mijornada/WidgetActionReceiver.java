package com.jmservices.mijornada;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class WidgetActionReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!MiJornadaWidgetProvider.ACTION_PUNCH.equals(intent.getAction())) {
            return;
        }

        String punchType = intent.getStringExtra(MiJornadaWidgetProvider.EXTRA_PUNCH_TYPE);
        if (punchType == null) return;

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.putExtra(MiJornadaWidgetProvider.EXTRA_PUNCH_TYPE, punchType);
        launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_NO_ANIMATION
        );
        context.startActivity(launchIntent);
    }
}
