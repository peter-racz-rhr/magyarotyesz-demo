package hu.magyarotyesz.app;

import android.os.Bundle;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

/**
 * The whole app: Capacitor's WebView showing the website, drawn edge to edge (Capacitor's SystemBars hands the
 * status and gesture bar sizes to the page). The launch screen is the app icon on the dark background.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
