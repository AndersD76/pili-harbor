package com.piliharbor.eaze.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.piliharbor.eaze.model.ManifestPackage

@Dao
interface ManifestDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(manifest: ManifestPackage)

    @Query("SELECT * FROM manifest_packages ORDER BY downloadedAt DESC LIMIT 1")
    suspend fun getLatest(): ManifestPackage?

    @Query("DELETE FROM manifest_packages")
    suspend fun deleteAll()
}
