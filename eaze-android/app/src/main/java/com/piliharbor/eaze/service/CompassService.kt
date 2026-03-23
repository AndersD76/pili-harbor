package com.piliharbor.eaze.service

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

/**
 * Provides device heading (compass bearing) from magnetometer.
 * Emits degrees (0=N, 90=E, 180=S, 270=W).
 */
class CompassService(context: Context) {

    private val sensorManager =
        context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    fun headingFlow(): Flow<Float> = callbackFlow {
        val rotationSensor = sensorManager.getDefaultSensor(
            Sensor.TYPE_ROTATION_VECTOR
        )

        val listener = object : SensorEventListener {
            private val rotationMatrix = FloatArray(9)
            private val orientation = FloatArray(3)

            override fun onSensorChanged(event: SensorEvent) {
                SensorManager.getRotationMatrixFromVector(
                    rotationMatrix, event.values
                )
                SensorManager.getOrientation(
                    rotationMatrix, orientation
                )
                // azimuth in radians → degrees
                val degrees = Math.toDegrees(
                    orientation[0].toDouble()
                ).toFloat()
                val heading = (degrees + 360) % 360
                trySend(heading)
            }

            override fun onAccuracyChanged(
                sensor: Sensor?, accuracy: Int,
            ) = Unit
        }

        if (rotationSensor != null) {
            sensorManager.registerListener(
                listener,
                rotationSensor,
                SensorManager.SENSOR_DELAY_UI,
            )
        }

        awaitClose {
            sensorManager.unregisterListener(listener)
        }
    }
}
