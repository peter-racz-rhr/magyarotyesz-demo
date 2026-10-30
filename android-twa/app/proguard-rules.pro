# The shell has almost no code of its own. Keep what the browser helper looks up by name.
-keep class com.google.androidbrowserhelper.** { *; }
-dontwarn com.google.androidbrowserhelper.**
