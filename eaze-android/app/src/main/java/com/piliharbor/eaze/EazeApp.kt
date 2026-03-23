package com.piliharbor.eaze

import android.app.Application
import com.piliharbor.eaze.data.local.EazeDatabase
import com.piliharbor.eaze.data.remote.ApiService
import com.piliharbor.eaze.data.remote.AuthInterceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

class EazeApp : Application() {

    lateinit var database: EazeDatabase
        private set
    lateinit var api: ApiService
        private set

    var accessToken: String? = null
    var currentYardId: String? = null
    var currentForkliftId: String? = null
    var userName: String? = null

    override fun onCreate() {
        super.onCreate()
        instance = this

        database = EazeDatabase.getInstance(this)

        val logging = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG)
                HttpLoggingInterceptor.Level.BODY
            else
                HttpLoggingInterceptor.Level.NONE
        }

        val client = OkHttpClient.Builder()
            .addInterceptor(AuthInterceptor { accessToken })
            .addInterceptor(logging)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

        api = Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL + "/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    companion object {
        lateinit var instance: EazeApp
            private set
    }
}
