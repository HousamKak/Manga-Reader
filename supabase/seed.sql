-- Seed default application settings for local development
insert into public.settings (id, user_id, data)
values (
  'global',
  null,
  jsonb_build_object(
    'readingMode', 'continuous',
    'readingDirection', 'ltr',
    'imageFit', 'height',
    'backgroundColor', 'white',
    'showPageNumbers', true,
    'preloadPages', 3,
    'fullscreen', false,
    'autoHideUI', true,
    'autoHideDelay', 3000,
    'defaultZoom', 1.0,
    'theme', 'auto',
    'language', 'en',
    'maxCacheSize', 500,
    'enableKeyboardShortcuts', true,
    'enableTouchGestures', true,
    'enablePreloading', true,
    'maxConcurrentLoads', 6
  )
)
on conflict (id) do nothing;
