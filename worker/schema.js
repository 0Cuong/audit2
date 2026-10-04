export const TABLES = {
  couple_profile: {
    id:"text", partner1_name:"text", partner1_avatar:"text", partner1_gender:"text",
    partner1_birthday:"date", partner2_name:"text", partner2_avatar:"text", partner2_gender:"text",
    partner2_birthday:"date", relationship_status:"text", relationship_start:"date",
    created_at:"text", updated_at:"text"
  },
  timeline_events: {
    id:"text", couple_id:"text", title:"text", date:"date", event_type:"text", story:"text",
    photos:"json", location:"text", mood:"text", tags:"json", sort_order:"number", from_partner:"text",
    description:"text", image_url:"text", category:"text", icon:"text", is_favorite:"boolean",
    created_at:"text", updated_at:"text"
  },
  memories: {
    id:"text", couple_id:"text", title:"text", category:"text", url:"text", description:"text",
    is_favorite:"boolean", is_pinned:"boolean", date:"date", tags:"json", collection_ids:"json",
    author_id:"text", author_name:"text", media_type:"text", context:"text", location:"json",
    metadata:"json", created_at:"text", updated_at:"text"
  },
  love_letters: {
    id:"text", couple_id:"text", title:"text", content:"text", from_partner:"text", to_partner:"text",
    is_draft:"boolean", is_locked:"boolean", scheduled_at:"text", is_future:"boolean",
    reaction:"text", created_at:"text", updated_at:"text", delivered_at:"text"
  },
  journal_entries: {
    id:"text", couple_id:"text", date:"date", content:"text", mood:"text", photos:"json",
    title:"text", content_html:"text", type:"text", time:"text", tags:"json",
    author_id:"text", author_name:"text", author:"text", location:"json", location_name:"text",
    is_favorite:"boolean", is_pinned:"boolean", metadata:"json",
    sender_name:"text", sender_avatar:"text", response_content:"text",
    response_sender_name:"text", response_sender_avatar:"text", response_date:"date",
    created_at:"text", updated_at:"text"
  },
  mood_entries: {
    id:"text", couple_id:"text", mood:"text", note:"text", partner:"text", date:"date",
    partner_id:"text", partner_name:"text", intensity:"number", created_at:"text", updated_at:"text"
  },
  bucket_list_items: {
    id:"text", couple_id:"text", title:"text", category:"text", description:"text",
    is_completed:"boolean", completed_at:"text", image_url:"text", from_partner:"text", created_at:"text", updated_at:"text"
  },
  anniversaries: {
    id:"text", couple_id:"text", title:"text", date:"date", anniversary_type:"text", type:"text",
    notes:"text", reminder_days:"number", recurrence:"text", photo_url:"text", created_at:"text", updated_at:"text"
  },
  map_locations: {
    id:"text", couple_id:"text", title:"text", description:"text", address:"text", latitude:"number",
    longitude:"number", location_type:"text", photos:"json", memory_id:"text", created_at:"text", updated_at:"text"
  },
  songs: {
    id:"text", couple_id:"text", title:"text", artist:"text", url:"text",
    is_favorite:"boolean", is_background:"boolean", artwork_url:"text", cover_url:"text", lyrics:"text", created_at:"text", updated_at:"text"
  },
  gifts: {
    id:"text", couple_id:"text", title:"text", description:"text", url:"text", image_url:"text",
    category:"text", occasion:"text", price_range:"text", is_received:"boolean",
    for_partner:"text", created_at:"text", updated_at:"text"
  },
  messages: {
    id:"text", couple_id:"text", content:"text", message_type:"text", is_pinned:"boolean",
    created_at:"text", updated_at:"text"
  },
  settings: {
    id:"text", couple_id:"text", language:"text", theme:"text", contact_links:"json",
    privacy_mode:"boolean", password_hash:"text", privacy_password:"text",
    notifications_enabled:"boolean", created_at:"text", updated_at:"text"
  },
  user_personalization: {
    id:"text", couple_id:"text", appearance:"json", background:"json", identity:"json",
    navigation:"json", active_workspace_id:"text", created_at:"text", updated_at:"text"
  },
  user_workspaces: {
    id:"text", couple_id:"text", name:"text", icon:"text", description:"text",
    is_default:"boolean", layout_mode:"text", blocks:"json", theme_override:"json",
    background_override:"json", navigation_override:"json", active_page_id:"text",
    created_at:"text", updated_at:"text"
  },
  user_custom_pages: {
    id:"text", couple_id:"text", workspace_id:"text", title:"text", slug:"text", icon:"text",
    description:"text", blocks:"json", is_default:"boolean", created_at:"text", updated_at:"text"
  },
  user_assets: {
    id:"text", couple_id:"text", name:"text", category:"text", url:"text", thumbnail:"text",
    size:"number", mime_type:"text", tags:"json", is_favorite:"boolean", created_at:"text"
  },
  user_saved_views: {
    id:"text", couple_id:"text", page_key:"text", name:"text", icon:"text", description:"text",
    filters:"json", sort_by:"text", sort_order:"text", display_mode:"text",
    is_default:"boolean", created_at:"text"
  },
  user_rules: {
    id:"text", couple_id:"text", name:"text", trigger:"text", condition:"json",
    action:"text", action_payload:"json", is_enabled:"boolean", created_at:"text"
  },
  user_presets: {
    id:"text", couple_id:"text", name:"text", description:"text", category:"text",
    author:"text", version:"text", preview_thumbnail:"text", tags:"json",
    appearance:"json", background:"json", navigation_style:"text",
    identity_decoration:"json", sample_blocks:"json", created_at:"text"
  },
  user_config_revisions: {
    id:"text", couple_id:"text", timestamp:"text", label:"text", snapshot:"json"
  },
  bucket_list_replies: {
    id:"text", created_at:"text", bucket_item_id:"text", content:"text", from_partner:"text"
  },
  couple_invites: {
    id:"text", couple_id:"text", email:"text", token:"text", created_by:"text",
    expires_at:"text", accepted_at:"text", created_at:"text"
  },
  couple_members: {
    couple_id:"text", user_id:"text", role:"text", created_at:"text"
  },
  listening_history: {
    id:"text", song_id:"text", played_at:"text"
  },
  love_letter_replies: {
    id:"text", letter_id:"text", content:"text", from_partner:"text", created_at:"text"
  },
  timeline_event_replies: {
    id:"number", event_id:"text", from_partner:"text", content:"text", created_at:"text"
  }
};

