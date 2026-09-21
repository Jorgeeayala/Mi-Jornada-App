package com.jmservices.mijornada;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    public static final String PREFS_NAME = "mijornada_widget_prefs";

    @PluginMethod
    public void syncState(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        String nextAction = call.getString("nextAction", "in");
        String lastTime = call.getString("lastTime", "");
        String statusLabel = call.getString("statusLabel", "");

        editor.putString("nextAction", nextAction);
        editor.putString("lastTime", lastTime);
        editor.putString("statusLabel", statusLabel);
        editor.apply();

        MiJornadaWidgetProvider.refreshAll(context);

        JSObject ret = new JSObject();
        ret.put("saved", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void getState(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        JSObject ret = new JSObject();
        ret.put("nextAction", prefs.getString("nextAction", "in"));
        ret.put("lastTime", prefs.getString("lastTime", ""));
        ret.put("statusLabel", prefs.getString("statusLabel", ""));
        call.resolve(ret);
    }

    // Llamado por React al abrir/reanudar la app: ¿me abrieron desde un botón del widget? (cold start)
    @PluginMethod
    public void consumePendingPunch(PluginCall call) {
        Activity activity = getActivity();
        JSObject ret = new JSObject();

        if (activity != null && activity.getIntent() != null) {
            String punchType = activity.getIntent().getStringExtra(MiJornadaWidgetProvider.EXTRA_PUNCH_TYPE);
            if (punchType != null) {
                ret.put("punchType", punchType);
                activity.getIntent().removeExtra(MiJornadaWidgetProvider.EXTRA_PUNCH_TYPE);
            } else {
                ret.put("punchType", (String) null);
            }
        } else {
            ret.put("punchType", (String) null);
        }
        call.resolve(ret);
    }

    // Llamado desde MainActivity.onNewIntent cuando la app YA estaba abierta
    public void notifyWidgetPunch(String punchType) {
        JSObject data = new JSObject();
        data.put("punchType", punchType);
        notifyListeners("widgetPunch", data);
    }

    @PluginMethod
    public void finishAfterWidgetPunch(PluginCall call) {
        final Activity activity = getActivity();
        call.resolve();
        if (activity != null) {
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                activity.moveTaskToBack(true);
            }, 450);
        }
    }
}
