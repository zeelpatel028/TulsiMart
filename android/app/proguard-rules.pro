# ProGuard rules for Tulsi Mart Android Application
# Preserve WebView Javascript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preserve WebKit classes
-keep class android.webkit.** { *; }

# Keep models and generated view bindings if any
-keep class com.tulsimart.app.** { *; }
