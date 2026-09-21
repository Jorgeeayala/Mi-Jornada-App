package com.jmservices.mijornada;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);

        String punchType = intent.getStringExtra(MiJornadaWidgetProvider.EXTRA_PUNCH_TYPE);
        if (punchType != null) {
            PluginHandle handle = getBridge().getPlugin("WidgetBridge");
            if (handle != null && handle.getInstance() instanceof WidgetBridgePlugin) {
                ((WidgetBridgePlugin) handle.getInstance()).notifyWidgetPunch(punchType);
            }
        }
    }
}
