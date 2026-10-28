export async function logActivity(
  client,
  { userId = null, action, module, recordType = null, recordId = null, description, ipAddress = null },
) {
  return client.activityLog.create({
    data: {
      userId,
      action,
      module,
      recordType,
      recordId,
      description,
      ipAddress,
    },
  });
}
