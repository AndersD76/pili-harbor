package com.piliharbor.eaze.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "manifest_packages")
data class ManifestPackage(
    @PrimaryKey val manifestId: String,
    val manifestName: String,
    val operationType: String,
    val vesselName: String?,
    val yardName: String?,
    val yardWidthMeters: Double,
    val yardHeightMeters: Double,
    val originLat: Double,
    val originLng: Double,
    val downloadedAt: Long = System.currentTimeMillis(),
)

@Entity(tableName = "tasks_offline")
data class TaskOffline(
    @PrimaryKey val taskId: String,
    val manifestId: String,
    val sequence: Int,
    val type: String,
    val priority: Int,
    val containerCode: String,
    val containerX: Double,
    val containerY: Double,
    val containerLat: Double,
    val containerLng: Double,
    val destinationLabel: String?,
    val destinationX: Double?,
    val destinationY: Double?,
    val destinationLat: Double?,
    val destinationLng: Double?,
    val aiInstructions: String?,
    val status: String = "pending",
    val completedAt: Long? = null,
    val syncedWithServer: Boolean = false,
)

/** API response models */
data class ManifestPackageResponse(
    val forklift_id: String,
    val manifest: ManifestInfo?,
    val tasks: List<TaskInfo>,
    val yard: YardInfo?,
)

data class ManifestInfo(
    val id: String,
    val name: String,
    val operation_type: String,
    val vessel_name: String?,
)

data class TaskInfo(
    val id: String,
    val sequence: Int,
    val type: String,
    val priority: Int,
    val container_code: String,
    val container_x: Double,
    val container_y: Double,
    val destination_label: String?,
    val destination_x: Double?,
    val destination_y: Double?,
    val ai_instructions: String?,
)

data class YardInfo(
    val name: String,
    val width_meters: Double,
    val height_meters: Double,
    val origin_lat: Double?,
    val origin_lng: Double?,
)

/** Auth models */
data class LoginRequest(
    val email: String,
    val password: String,
)

data class LoginResponse(
    val access_token: String,
    val refresh_token: String,
    val user: UserInfo,
)

data class UserInfo(
    val id: String,
    val full_name: String,
    val role: String,
    val tenant_id: String,
)

data class ForkliftInfo(
    val id: String,
    val code: String,
    val status: String,
    val operator_id: String?,
)

data class YardListItem(
    val id: String,
    val name: String,
)
