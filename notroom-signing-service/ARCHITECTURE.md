# Notroom Application Architecture

## Overview
This document describes the architecture and design patterns used in the Notroom web application.

## Technology Stack

### Core
- **React 18.3**: UI library with concurrent features
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **React Router v6**: Client-side routing

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Shadcn/ui**: Pre-built component library

### Forms & Validation
- **React Hook Form**: Performant form management
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration between RHF and Zod

### Backend & Database
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Edge Functions
  - Storage

### State Management
- **React Query (TanStack Query)**: Server state management
- **React Context**: Global client state
- **Local Storage hooks**: Persistent client state

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn UI components
│   ├── marketing/      # Marketing-specific components
│   └── ...             # Feature components
├── pages/              # Route-based pages
│   ├── services/       # Service pages
│   ├── areas/          # Location pages
│   │   └── cities/     # City-specific pages
│   ├── resources/      # Resource pages
│   └── admin/          # Admin pages
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # App constants and config
├── integrations/       # Third-party integrations
│   └── supabase/       # Supabase client and types
└── lib/                # Core libraries

public/
├── assets/             # Static assets
├── robots.txt          # SEO crawler instructions
└── sitemap.xml         # SEO sitemap

supabase/
├── functions/          # Edge Functions
└── config.toml         # Supabase configuration
```

## Design Patterns

### Component Architecture
- **Atomic Design**: Components organized from atoms to organisms
- **Composition over Inheritance**: Favor composition patterns
- **Single Responsibility**: Each component has one clear purpose

### State Management Strategy
1. **Server State**: React Query for API data
2. **Form State**: React Hook Form for form data
3. **UI State**: useState/useReducer for component state
4. **Global State**: Context for cross-cutting concerns
5. **Persistent State**: Custom hooks for localStorage

### Code Organization
- **Feature-based folders**: Group by feature, not by type
- **Index exports**: Clean public APIs
- **Type co-location**: Types near their usage
- **Utility separation**: Shared utils in dedicated folder

## Data Flow

### Booking Flow
```
User Input → BookingForm
           ↓
       Validation (Zod)
           ↓
       Supabase Insert
           ↓
    Edge Functions (Email/Webhook)
           ↓
       Success/Error State
```

### Authentication Flow
```
Login Form → Supabase Auth
           ↓
       JWT Token
           ↓
    Protected Routes
           ↓
    User Session Context
```

## Performance Optimizations

### Build-time
- Code splitting by vendor chunks
- Tree shaking of unused code
- Asset optimization
- Source map generation

### Runtime
- React.memo for expensive components
- useCallback/useMemo for functions/values
- Intersection Observer for lazy loading
- Debounced inputs
- Virtual scrolling (when needed)

### Network
- Resource prefetching
- Image lazy loading
- Service Worker (future)
- CDN for static assets (production)

## SEO Strategy

### On-Page SEO
- Semantic HTML structure
- Meta tags per page
- Structured data (JSON-LD)
- Canonical URLs
- Open Graph tags

### Technical SEO
- XML sitemap
- Robots.txt configuration
- Performance optimization
- Mobile responsiveness
- Accessibility (WCAG 2.1 AA)

### Content SEO
- Keyword-optimized content
- Local SEO for Erie, PA
- Service-specific pages
- Location-specific pages
- FAQ sections

## Security Measures

### Input Validation
- Client-side validation (Zod)
- Server-side validation (Edge Functions)
- XSS prevention (input sanitization)
- SQL injection prevention (Supabase RLS)

### Authentication
- JWT-based authentication
- Secure session management
- Role-based access control (RBAC)
- Protected routes

### Data Protection
- HTTPS enforcement
- Row Level Security (RLS)
- Secure headers
- CORS configuration

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Color contrast ratios
- Touch target sizes (44x44px minimum)
- Skip navigation link
- Focus indicators

## Testing Strategy (Recommended)

### Unit Tests
- Utility functions
- Custom hooks
- Complex logic

### Integration Tests
- Form submissions
- API interactions
- Component interactions

### E2E Tests
- Critical user flows
- Booking process
- Payment flows
- Admin functions

## Deployment

### Build Process
```
npm run build → Vite build
              ↓
          Static assets
              ↓
         CDN/Hosting
```

### Environments
- **Development**: Local Vite dev server
- **Staging**: Lovable preview
- **Production**: Custom domain with CDN

## Monitoring & Analytics

### Performance Monitoring
- Core Web Vitals
- Lighthouse scores
- Custom performance metrics

### User Analytics
- Page views
- Conversion tracking
- User behavior flows
- Error tracking

### Error Tracking
- Client-side error boundary
- Server-side error logging
- User feedback collection

## Best Practices

### Code Quality
- ESLint for linting
- Prettier for formatting
- TypeScript strict mode
- Code reviews

### Git Workflow
- Feature branches
- Descriptive commits
- Pull request reviews
- Semantic versioning

### Documentation
- Code comments for complex logic
- JSDoc for public APIs
- README files for features
- Architecture documentation (this file)

## Future Enhancements

### Planned Features
1. Progressive Web App (PWA)
2. Advanced analytics integration
3. A/B testing framework
4. Internationalization (i18n)
5. Real-time notifications
6. Advanced admin dashboard
7. Automated testing suite
8. Performance monitoring dashboard

### Technical Debt
- Refactor large components
- Improve test coverage
- Optimize bundle size
- Implement service worker
- Add Storybook for components

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review and update SEO quarterly
- Performance audits quarterly
- Security audits quarterly
- Code cleanup as needed

### Monitoring
- Check error logs daily
- Review analytics weekly
- Performance metrics weekly
- User feedback continuous