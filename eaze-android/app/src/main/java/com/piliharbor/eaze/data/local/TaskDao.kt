package com.piliharbor.eaze.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.piliharbor.eaze.model.TaskOffline
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tasks: List<TaskOffline>)

    @Query(
        "SELECT * FROM tasks_offline WHERE manifestId = :manifestId " +
        "ORDER BY sequence ASC"
    )
    suspend fun getByManifest(manifestId: String): List<TaskOffline>

    @Query(
        "SELECT * FROM tasks_offline WHERE manifestId = :manifestId " +
        "AND status != 'done' ORDER BY sequence ASC LIMIT 1"
    )
    suspend fun getNextPending(manifestId: String): TaskOffline?

    @Query(
        "SELECT COUNT(*) FROM tasks_offline WHERE manifestId = :manifestId " +
        "AND status != 'done'"
    )
    suspend fun countRemaining(manifestId: String): Int

    @Query(
        "SELECT COUNT(*) FROM tasks_offline WHERE manifestId = :manifestId"
    )
    suspend fun countTotal(manifestId: String): Int

    @Query(
        "UPDATE tasks_offline SET status = :status, " +
        "completedAt = :completedAt, syncedWithServer = :synced " +
        "WHERE taskId = :taskId"
    )
    suspend fun updateStatus(
        taskId: String,
        status: String,
        completedAt: Long?,
        synced: Boolean,
    )

    @Query(
        "SELECT * FROM tasks_offline WHERE syncedWithServer = 0 " +
        "AND status = 'done'"
    )
    suspend fun getUnsyncedDone(): List<TaskOffline>

    @Query("DELETE FROM tasks_offline WHERE manifestId = :manifestId")
    suspend fun deleteByManifest(manifestId: String)
}
