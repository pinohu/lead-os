<?php
/**
 * Plugin Name: Lead OS Embed
 * Plugin URI:  https://github.com/pinohu/lead-os-embed-widgets
 * Description: Injects the Lead OS widget into a WordPress site and points it at a hosted Lead OS runtime.
 * Version:     0.2.0
 * Author:      Lead OS
 * Author URI:  https://github.com/pinohu
 * License:     MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: lead-os-embed
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

function lead_os_embed_register_settings() {
    register_setting('lead_os_embed', 'lead_os_runtime_base_url', array(
        'type' => 'string',
        'sanitize_callback' => 'esc_url_raw',
        'default' => '',
    ));
    register_setting('lead_os_embed', 'lead_os_service', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default' => 'lead-capture',
    ));
    register_setting('lead_os_embed', 'lead_os_niche', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default' => 'general',
    ));
    register_setting('lead_os_embed', 'lead_os_auto_inject', array(
        'type' => 'string',
        'sanitize_callback' => 'sanitize_text_field',
        'default' => '1',
    ));
}

add_action('admin_init', 'lead_os_embed_register_settings');

function lead_os_embed_admin_page() {
    ?>
    <div class="wrap">
      <h1><?php esc_html_e('Lead OS Embed', 'lead-os-embed'); ?></h1>
      <form method="post" action="options.php">
        <?php settings_fields('lead_os_embed'); ?>
        <table class="form-table">
          <tr>
            <th scope="row"><label for="lead_os_runtime_base_url"><?php esc_html_e('Runtime Base URL', 'lead-os-embed'); ?></label></th>
            <td><input type="url" class="regular-text" id="lead_os_runtime_base_url" name="lead_os_runtime_base_url" value="<?php echo esc_attr(get_option('lead_os_runtime_base_url', '')); ?>" /></td>
          </tr>
          <tr>
            <th scope="row"><label for="lead_os_service"><?php esc_html_e('Default Service', 'lead-os-embed'); ?></label></th>
            <td><input type="text" class="regular-text" id="lead_os_service" name="lead_os_service" value="<?php echo esc_attr(get_option('lead_os_service', 'lead-capture')); ?>" /></td>
          </tr>
          <tr>
            <th scope="row"><label for="lead_os_niche"><?php esc_html_e('Default Niche', 'lead-os-embed'); ?></label></th>
            <td><input type="text" class="regular-text" id="lead_os_niche" name="lead_os_niche" value="<?php echo esc_attr(get_option('lead_os_niche', 'general')); ?>" /></td>
          </tr>
          <tr>
            <th scope="row"><?php esc_html_e('Auto Inject', 'lead-os-embed'); ?></th>
            <td><label><input type="checkbox" name="lead_os_auto_inject" value="1" <?php checked(get_option('lead_os_auto_inject', '1'), '1'); ?> /> <?php esc_html_e('Inject widget into every page footer', 'lead-os-embed'); ?></label></td>
          </tr>
        </table>
        <?php submit_button(); ?>
      </form>
      <p><?php
        printf(
            /* translators: %s: shortcode tag */
            esc_html__('Shortcode: %s', 'lead-os-embed'),
            '<code>[lead_os_embed]</code>'
        );
      ?></p>
    </div>
    <?php
}

function lead_os_embed_add_admin_menu() {
    add_options_page(
        __('Lead OS Embed', 'lead-os-embed'),
        __('Lead OS Embed', 'lead-os-embed'),
        'manage_options',
        'lead-os-embed',
        'lead_os_embed_admin_page'
    );
}

add_action('admin_menu', 'lead_os_embed_add_admin_menu');

function lead_os_embed_markup() {
    $runtime_base_url = esc_url(get_option('lead_os_runtime_base_url', ''));
    if (empty($runtime_base_url)) {
        return '';
    }

    $service = esc_js(get_option('lead_os_service', 'lead-capture'));
    $niche = esc_js(get_option('lead_os_niche', 'general'));
    $runtime_js = esc_js($runtime_base_url);

    ob_start();
    ?>
    <script>
      window.LeadOSConfig = {
        runtimeBaseUrl: "<?php echo $runtime_js; ?>",
        service: "<?php echo $service; ?>",
        niche: "<?php echo $niche; ?>"
      };
    </script>
    <script src="<?php echo esc_url($runtime_base_url); ?>/embed/lead-os-embed.js" defer></script>
    <?php
    return ob_get_clean();
}

function lead_os_embed_print_script() {
    if (get_option('lead_os_auto_inject', '1') !== '1') {
        return;
    }

    $markup = lead_os_embed_markup();
    if (!empty($markup)) {
        echo $markup; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped in lead_os_embed_markup
    }
}

add_action('wp_footer', 'lead_os_embed_print_script');
add_shortcode('lead_os_embed', 'lead_os_embed_markup');
