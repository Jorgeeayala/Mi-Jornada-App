package com.jmservices.mijornada;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class MiJornadaWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_PUNCH = "com.jmservices.mijornada.ACTION_PUNCH";
    public static final String EXTRA_PUNCH_TYPE = "punchType";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
        String nextAction = prefs.getString("nextAction", "in");
        String statusLabel = prefs.getString("statusLabel", "Mi Jornada");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_mijornada);
        views.setTextViewText(R.id.widget_status_label, statusLabel);

        // Resetear todos a inactivo
        views.setInt(R.id.btn_in, "setBackgroundResource", R.drawable.widget_btn_inactive);
        views.setInt(R.id.btn_lunch_out, "setBackgroundResource", R.drawable.widget_btn_inactive);
        views.setInt(R.id.btn_lunch_in, "setBackgroundResource", R.drawable.widget_btn_inactive);
        views.setInt(R.id.btn_out, "setBackgroundResource", R.drawable.widget_btn_inactive);

        // Resaltar el que corresponde
        int activeViewId = R.id.btn_in;
        if ("in".equals(nextAction)) activeViewId = R.id.btn_in;
        else if ("lunchOut".equals(nextAction)) activeViewId = R.id.btn_lunch_out;
        else if ("lunchIn".equals(nextAction)) activeViewId = R.id.btn_lunch_in;
        else if ("out".equals(nextAction)) activeViewId = R.id.btn_out;
        views.setInt(activeViewId, "setBackgroundResource", R.drawable.widget_btn_active);

        // Click listeners: cada botón dispara un Intent nativo (nada de URLs)
        setButtonIntent(context, views, R.id.btn_in, "in", appWidgetId);
        setButtonIntent(context, views, R.id.btn_lunch_out, "lunchOut", appWidgetId);
        setButtonIntent(context, views, R.id.btn_lunch_in, "lunchIn", appWidgetId);
        setButtonIntent(context, views, R.id.btn_out, "out", appWidgetId);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static void setButtonIntent(Context context, RemoteViews views, int viewId, String punchType, int appWidgetId) {
        Intent intent = new Intent(context, WidgetActionReceiver.class);
        intent.setAction(ACTION_PUNCH);
        intent.putExtra(EXTRA_PUNCH_TYPE, punchType);
        // requestCode único por botón+widget para que no se pisen los PendingIntents
        int requestCode = appWidgetId * 10 + punchType.hashCode() % 10;
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(viewId, pendingIntent);
    }

    public static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName thisWidget = new ComponentName(context, MiJornadaWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(thisWidget);
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }
}
