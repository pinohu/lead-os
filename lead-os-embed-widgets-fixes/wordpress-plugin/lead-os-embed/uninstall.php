<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package Lead_OS_Embed
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

delete_option('lead_os_runtime_base_url');
delete_option('lead_os_service');
delete_option('lead_os_niche');
delete_option('lead_os_auto_inject');
