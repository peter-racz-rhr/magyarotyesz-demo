package hu.magyarotyesz.app;

import com.google.androidbrowserhelper.locationdelegation.LocationDelegationExtraCommandHandler;

/**
 * Lets the website use the phone's location and notifications through this app (Trusted Web Activity delegation),
 * so the permission prompts are the app's own and "Nearest" works like in a normal Android app.
 */
public class DelegationService extends com.google.androidbrowserhelper.trusted.DelegationService {
    @Override
    public void onCreate() {
        super.onCreate();
        registerExtraCommandHandler(new LocationDelegationExtraCommandHandler());
    }
}
