package com.piliharbor.eaze.service

import android.annotation.SuppressLint
import android.content.Context
import android.os.Looper
import com.google.android.gms.location.*
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

data class GpsLocation(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float,
)

/**
 * Provides GPS location updates from the tablet.
 * Uses FusedLocationProviderClient for best accuracy.
 */
class LocationService(context: Context) {

    private val client: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission")
    fun locationFlow(intervalMs: Long = 2000): Flow<GpsLocation> =
        callbackFlow {
            val request = LocationRequest.Builder(
                Priority.PRIORITY_HIGH_ACCURACY, intervalMs
            )
                .setMinUpdateIntervalMillis(1000)
                .build()

            val callback = object : LocationCallback() {
                override fun onLocationResult(result: LocationResult) {
                    result.lastLocation?.let { loc ->
                        trySend(
                            GpsLocation(
                                latitude = loc.latitude,
                                longitude = loc.longitude,
                                accuracy = loc.accuracy,
                            )
                        )
                    }
                }
            }

            client.requestLocationUpdates(
                request, callback, Looper.getMainLooper()
            )

            awaitClose {
                client.removeLocationUpdates(callback)
            }
        }
}
