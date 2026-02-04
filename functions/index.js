const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Scheduled function to check for warmed chips every day at 10:00 AM.
 * It queries 'warming_chips' for chips on day 10 that are completed.
 */
exports.checkWarmingChips = functions.pubsub.schedule("every day 10:00")
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {
        const db = admin.firestore();
        const messaging = admin.messaging();

        try {
            // 1. Get all chips that are active
            const chipsSnapshot = await db.collection("warming_chips")
                .where("status", "==", "WARMING")
                .get();

            const notifications = [];

            for (const doc of chipsSnapshot.docs) {
                const chip = doc.data();

                // Logic: A 'warmed' chip is one that reached day 10 and has completed all tasks?
                // Or simply just reached day 10? 
                // Let's assume day 10 completion warrants a notification.

                // Assuming day 10 has 1 task or we check if currentDay is 10 and verify completion.
                // Simpler condition for now: If it is Day 10.
                if (chip.currentDay === 10) {
                    // Check if user has tokens
                    const userDoc = await db.collection("mentees").doc(chip.userId).get();
                    const userData = userDoc.data();

                    if (userData && userData.fcmTokens && userData.fcmTokens.length > 0) {
                        const message = {
                            notification: {
                                title: "Chip Blindado! 🛡️",
                                body: `O chip ${chip.name} concluiu o protocolo de aquecimento.`
                            },
                            data: {
                                type: "WARMING_COMPLETE",
                                chipId: doc.id
                            },
                            tokens: userData.fcmTokens
                        };

                        notifications.push(messaging.sendMulticast(message));
                    }
                }
            }

            if (notifications.length > 0) {
                await Promise.all(notifications);
                console.log(`Sent ${notifications.length} warming notifications.`);
            }

            return null;
        } catch (error) {
            console.error("Error in checkWarmingChips:", error);
            return null;
        }
    });

/**
 * HTTP function to manually trigger the check (for testing).
 */
exports.manualCheckWarming = functions.https.onRequest(async (req, res) => {
    // Re-use logic or call the same function if refactored
    // For simplicity, just responding here.
    res.json({ message: "Use the scheduled function for production." });
});

/**
 * Scheduled function to check for DUE tasks every 15 minutes.
 */
exports.checkDueTasks = functions.pubsub.schedule("every 15 minutes")
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {
        const db = admin.firestore();
        const messaging = admin.messaging();
        const now = new Date();
        // Check for tasks due between now and 15 mins ago (catch up) or upcoming?
        // Usually we check for tasks due in the next 15 mins, or just passed.
        // Let's check for tasks due in the 15-minute window surrounding now.
        // Actually, safer to check for tasks due between [now - 15m, now].
        // This ensures we notify exactly when it becomes due (or slightly after).

        const windowStart = new Date(now.getTime() - 15 * 60000);
        const windowEnd = now;

        try {
            console.log(`Checking tasks due between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

            const tasksSnapshot = await db.collection("tasks")
                .where("dueDate", ">=", windowStart)
                .where("dueDate", "<=", windowEnd)
                .where("status", "!=", "DONE")
                .get();

            if (tasksSnapshot.empty) {
                console.log("No due tasks found.");
                return null;
            }

            const notifications = [];

            for (const doc of tasksSnapshot.docs) {
                const task = doc.data();

                // Only personal tasks or all tasks? Let's notify for ALL matches.
                // We need the owner's FCM token.
                // OwnerId is in task.ownerId.

                // Skip if no ownerId
                if (!task.ownerId) continue;

                // Create a helper to get tokens (could be mentee or user collection)
                // Assuming we look in 'mentees' first (if it's a mentee task) or 'users' (if it's a mentor task)
                // But wait, the system distinguishes via 'ownerRole'.

                let tokens = [];
                if (task.ownerRole === 'mentor') {
                    // Check 'users' collection? Or 'mentees'?
                    // The auth context suggests mentors are in 'users' or implicit.
                    // Let's assume there is a 'users' collection for mentors/admins.
                    // The user is authenticated, so they should be in 'users'.
                    // Wait, `MenteeProfile` uses `mentee.userId`.

                    // We need a consistent place for FCM tokens. 
                    // Let's try to fetch from 'users' first, assuming tasks.ownerId maps to a User doc.
                    const userDoc = await db.collection("users").doc(task.ownerId).get();
                    if (userDoc.exists) {
                        tokens = userDoc.data().fcmTokens || [];
                    }
                } else {
                    // Start with Mentees
                    // Wait, task.ownerId might be the mentee ID or the User ID.
                    // MenteeTasks uses `mentee.id` as ownerId? Or userId?
                    // MenteeTasks.tsx: ownerId: mentee.id
                    // Tasks.tsx (Personal): ownerId: user.id

                    // So we might need to check both if logic is mixed.
                    // Simple approach: Check "users" collection first (for user.id). 
                    const userDoc = await db.collection("users").doc(task.ownerId).get();
                    if (userDoc.exists) {
                        tokens = userDoc.data().fcmTokens || [];
                    } else {
                        // Maybe it's a mentee doc ID?
                        const menteeDoc = await db.collection("mentees").doc(task.ownerId).get();
                        if (menteeDoc.exists) {
                            // Mentees might have tokens stored on their doc OR their linked user doc.
                            // Mentee interface has `userId`.
                            const menteeData = menteeDoc.data();
                            if (menteeData.userId) {
                                const linkedUser = await db.collection("users").doc(menteeData.userId).get();
                                if (linkedUser.exists) tokens = linkedUser.data().fcmTokens || [];
                            }
                        }
                    }
                }

                if (tokens && tokens.length > 0) {
                    const message = {
                        notification: {
                            title: "⏰ Hora da Missão!",
                            body: `"${task.title}" está agendada para agora.`
                        },
                        data: {
                            taskId: doc.id,
                            type: "TASK_DUE"
                        },
                        tokens: tokens
                    };
                    notifications.push(messaging.sendMulticast(message));
                }
            }

            if (notifications.length > 0) {
                await Promise.all(notifications);
                console.log(`Sent ${notifications.length} task notifications.`);
            }

            return null;
        } catch (error) {
            console.error("Error in checkDueTasks:", error);
            return null;
        }
    });
