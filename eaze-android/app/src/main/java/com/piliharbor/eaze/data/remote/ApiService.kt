package com.piliharbor.eaze.data.remote

import com.piliharbor.eaze.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/v1/auth/login")
    suspend fun login(@Body body: LoginRequest): LoginResponse

    @GET("api/v1/yards")
    suspend fun getYards(): List<YardListItem>

    @GET("api/v1/yards/{yardId}/forklifts")
    suspend fun getForklifts(
        @Path("yardId") yardId: String,
    ): List<ForkliftInfo>

    @POST("api/v1/forklifts/{forkliftId}/claim")
    suspend fun claimForklift(
        @Path("forkliftId") forkliftId: String,
    ): Response<Unit>

    @POST("api/v1/forklifts/{forkliftId}/release")
    suspend fun releaseForklift(
        @Path("forkliftId") forkliftId: String,
    ): Response<Unit>

    @GET("api/v1/forklifts/{forkliftId}/manifest-package")
    suspend fun getManifestPackage(
        @Path("forkliftId") forkliftId: String,
    ): ManifestPackageResponse

    @PUT("api/v1/yards/{yardId}/tasks/{taskId}/status")
    suspend fun updateTaskStatus(
        @Path("yardId") yardId: String,
        @Path("taskId") taskId: String,
        @Body body: Map<String, String>,
    ): Response<Unit>
}
