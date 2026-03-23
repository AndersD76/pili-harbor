package com.piliharbor.eaze.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.piliharbor.eaze.model.ManifestPackage
import com.piliharbor.eaze.model.TaskOffline

@Database(
    entities = [ManifestPackage::class, TaskOffline::class],
    version = 1,
    exportSchema = false,
)
abstract class EazeDatabase : RoomDatabase() {
    abstract fun manifestDao(): ManifestDao
    abstract fun taskDao(): TaskDao

    companion object {
        @Volatile
        private var INSTANCE: EazeDatabase? = null

        fun getInstance(context: Context): EazeDatabase {
            return INSTANCE ?: synchronized(this) {
                Room.databaseBuilder(
                    context.applicationContext,
                    EazeDatabase::class.java,
                    "eaze_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                    .also { INSTANCE = it }
            }
        }
    }
}
