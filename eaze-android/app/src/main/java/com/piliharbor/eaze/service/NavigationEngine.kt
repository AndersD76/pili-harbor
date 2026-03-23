package com.piliharbor.eaze.service

import kotlin.math.*

enum class Direction {
    STRAIGHT,
    SLIGHT_LEFT, LEFT, SHARP_LEFT,
    SLIGHT_RIGHT, RIGHT, SHARP_RIGHT,
    U_TURN, ARRIVED
}

object NavigationEngine {

    /** Bearing in degrees from point A to point B (0=N, 90=E). */
    fun getBearing(
        fromLat: Double, fromLng: Double,
        toLat: Double, toLng: Double,
    ): Float {
        val lat1 = Math.toRadians(fromLat)
        val lat2 = Math.toRadians(toLat)
        val dLng = Math.toRadians(toLng - fromLng)

        val y = sin(dLng) * cos(lat2)
        val x = cos(lat1) * sin(lat2) -
            sin(lat1) * cos(lat2) * cos(dLng)

        val bearing = Math.toDegrees(atan2(y, x))
        return ((bearing + 360) % 360).toFloat()
    }

    /** Distance in meters between two GPS points. */
    fun getDistance(
        lat1: Double, lng1: Double,
        lat2: Double, lng2: Double,
    ): Float {
        // For short distances (<1km), flat approximation
        val dLat = lat2 - lat1
        val dLng = lng2 - lng1
        val mPerDegLat = 111_320.0
        val mPerDegLng = 111_320.0 * cos(Math.toRadians(lat1))

        val dy = dLat * mPerDegLat
        val dx = dLng * mPerDegLng

        return sqrt(dx * dx + dy * dy).toFloat()
    }

    /**
     * Get navigation direction comparing target bearing
     * with device heading (from compass).
     */
    fun getDirection(
        bearing: Float,
        heading: Float,
        distance: Float,
    ): Direction {
        if (distance < 5f) return Direction.ARRIVED

        // Angle difference (-180 to 180)
        var diff = bearing - heading
        if (diff > 180) diff -= 360
        if (diff < -180) diff += 360

        return when {
            abs(diff) < 15 -> Direction.STRAIGHT
            diff in 15.0..45.0 -> Direction.SLIGHT_RIGHT
            diff in 45.0..135.0 -> Direction.RIGHT
            diff in 135.0..180.0 -> Direction.SHARP_RIGHT
            diff in -45.0..-15.0 -> Direction.SLIGHT_LEFT
            diff in -135.0..-45.0 -> Direction.LEFT
            diff in -180.0..-135.0 -> Direction.SHARP_LEFT
            else -> Direction.U_TURN
        }
    }

    /** Human-readable direction text in Portuguese. */
    fun getDirectionText(
        direction: Direction,
        distance: Float,
    ): String {
        val distText = if (distance >= 1000) {
            "%.1f km".format(distance / 1000)
        } else {
            "%.0f m".format(distance)
        }

        return when (direction) {
            Direction.ARRIVED -> "Você chegou!"
            Direction.STRAIGHT -> "Siga em frente $distText"
            Direction.SLIGHT_LEFT -> "Ligeiramente à esquerda $distText"
            Direction.LEFT -> "Vire à esquerda $distText"
            Direction.SHARP_LEFT -> "Curva à esquerda $distText"
            Direction.SLIGHT_RIGHT -> "Ligeiramente à direita $distText"
            Direction.RIGHT -> "Vire à direita $distText"
            Direction.SHARP_RIGHT -> "Curva à direita $distText"
            Direction.U_TURN -> "Retorne $distText"
        }
    }

    /** Convert yard meters to GPS coordinates. */
    fun yardToGps(
        xMeters: Double,
        yMeters: Double,
        originLat: Double,
        originLng: Double,
    ): Pair<Double, Double> {
        val lat = originLat + (yMeters / 111_320.0)
        val lng = originLng + (
            xMeters / (111_320.0 * cos(Math.toRadians(originLat)))
        )
        return lat to lng
    }
}
