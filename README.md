# duty-paging
Weekly shift notification

# CRONTAB entries

00 18 * * 4 bash -l -c 'sh /home/<useracct_homedir>/esar_duty.sh'

35 11 * * 5 bash -l -c 'sh /home/<useracct_homedir>/gap_duty.sh'

# Dev environment variables

GCLOUD_PROJECT=<project_id>

GOOGLE_APPLICATION_CREDENTIALS=/home/kcesar/esar.duty/google/service_account_credentials.json

DEFAULT_COMMS=ESAR Comms ##########

ESAR_GAP_SENDER=<email>

ESAR_GAP_RECEIVER=<email>

ESAR_GAP_SEND_KEY=<sparkpost_sender_API>
