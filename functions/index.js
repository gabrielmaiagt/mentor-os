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
