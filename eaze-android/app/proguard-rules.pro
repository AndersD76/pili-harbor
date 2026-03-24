# Eaze Android ProGuard rules
-keepattributes Signature
-keepattributes *Annotation*

# Retrofit
-keep class com.piliharbor.eaze.model.** { *; }
-keepclassmembers class com.piliharbor.eaze.model.** { *; }

# Gson
-keep class com.google.gson.** { *; }
