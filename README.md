# Attio CLI

> A production-grade, fully-typed TypeScript CLI for managing [Attio CRM](https://attio.com) via REST API.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Install

```bash
npm install -g attio-cli
export ATTIO_API_KEY="attio_sk_your_key_here"
attio workspace members list
```

From a git checkout instead of npm:

```bash
git clone https://github.com/ekrtf/attio-cli.git
cd attio-cli
npm install
npm run build
npm link
```

The longer install notes are in [Installation](#installation).

---

## Features

### 🎯 Core Capabilities
- **Workspace Management** - List and manage workspace members with role-based access
- **Objects & Attributes** - Full CRUD for custom objects, attributes, select options, and statuses
- **Records** - Query, create, update, and delete people, companies, and deals with advanced filtering
- **Lists & Entries** - Manage lists and their entries with attribute values
- **Notes & Tasks** - Create and organize notes and tasks linked to records
- **Meetings** - List, create, link, and delete meetings
- **Comments** - Create, read, and delete comments on records, entries, and threads

### 🚀 Developer Experience
- **Fully Typed** - TypeScript strict mode with Zod runtime validation
- **Multiple Formats** - JSON, Table, and CSV output for all commands
- **Smart Filtering** - Advanced query syntax with `$eq`, `$contains`, `$gt`, etc.
- **Error Handling** - Automatic retry with exponential backoff for rate limits
- **Integration Tested** - 112 tests validated against live Attio API

### 🛠️ Advanced Features
- **Attribute Management** - Unified commands for both objects and lists
- **Convenience Commands** - `attributes-with-values` fetches complete schemas in one call
- **Batch Operations** - Assert (upsert) records by matching attributes
- **Schema Export** - Export complete object/list definitions as JSON or CSV

---

## Table of Contents

- [Install](#install)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Commands](#commands)
  - [Workspace](#workspace)
  - [Objects](#objects)
  - [Attributes](#attributes)
  - [Records](#records)
  - [Lists](#lists)
  - [Entries](#entries)
  - [Notes](#notes)
  - [Tasks](#tasks)
  - [Meetings](#meetings)
- [Output Formats](#output-formats)
- [Filtering & Sorting](#filtering--sorting)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

### Via npm (Recommended)

```bash
npm install -g attio-cli
```

### Via npx (No Installation)

```bash
npx attio-cli --help
```

### From Source

```bash
# Clone the repository
git clone https://github.com/ekrtf/attio-cli.git
cd attio-cli

# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link

# Verify installation
attio --version
```

---

## Quick Start

### 1. Get Your API Key

1. Navigate to [Attio Settings > API](https://app.attio.com/settings/api)
2. Click **Create new token**
3. Copy your API key (starts with `attio_sk_`)

### 2. Configure Authentication

**Option A: Environment Variable (Recommended)**

```bash
export ATTIO_API_KEY="attio_sk_your_key_here"
```

Add to your `.bashrc`, `.zshrc`, or `.env` file for persistence:

```bash
echo 'export ATTIO_API_KEY="attio_sk_your_key_here"' >> ~/.zshrc
source ~/.zshrc
```

**Option B: Per-Command Flag**

```bash
attio --api-key attio_sk_your_key_here workspace members list
```

### 3. Verify Setup

```bash
# List workspace members
attio workspace members list --format table

# Get all objects
attio object list --format table

# Query people records
attio record list people --limit 5 --format json
```

---

## Authentication

### Environment Variable

The CLI reads `ATTIO_API_KEY` from your environment:

```bash
export ATTIO_API_KEY="attio_sk_your_key_here"
attio workspace members list
```

### .env File

Create a `.env` file in your working directory:

```bash
# .env
ATTIO_API_KEY=attio_sk_your_key_here
```

The CLI reads only `ATTIO_API_KEY` from a `.env` file in the working directory. Other variables in that file are ignored.

### Command-Line Override

Override the environment variable for a single command:

```bash
attio --api-key attio_sk_different_key object list
```

The flag is visible to other users on the machine while the command runs. Prefer `ATTIO_API_KEY` when you can.

---

## Commands

### Workspace

Manage workspace members and settings.

```bash
# List all workspace members
attio workspace members list [--limit <n>] [--offset <n>] [--format json|table|csv]

# Get specific workspace member
attio workspace members get <member-id> [--format json|table|csv]
```

**Examples:**

```bash
# List first 10 members as table
attio workspace members list --limit 10 --format table

# Get specific member details
attio workspace members get wm_abc123 --format json

# Export all members to CSV
attio workspace members list --format csv > members.csv
```

---

### Objects

Manage objects (people, companies, deals, custom objects).

```bash
# List all objects
attio object list [--format json|table|csv]

# Get specific object
attio object get <slug> [--format json|table|csv]

# Create a custom object
attio object create --api-slug <slug> --singular <noun> --plural <noun>

# Update an object definition
attio object update <slug> [--api-slug <slug>] [--singular <noun>] [--plural <noun>]

# Delete a custom object
attio object delete <slug>

# List saved views
attio object views <slug> [--show-archived] [--limit <n>] [--cursor <cursor>]

# List attributes for an object
attio object attributes <object-slug> [--format json|table|csv]

# Get complete object schema with attribute values
attio object attributes-with-values <object-slug> [--show-archived] [--format json|table|csv]
```

**Examples:**

```bash
# List all objects
attio object list --format table

# Get people object details
attio object get people --format json

# List attributes for companies
attio object attributes companies --format table

# Export complete people schema (attributes + select options + statuses)
attio object attributes-with-values people --format json > people-schema.json
```

---

### Attributes

Complete CRUD operations for attributes, select options, and statuses. Works with both **objects** and **lists**.

#### List & Get Attributes

```bash
# List attributes for an object or list
attio attribute list <target> <identifier> [--show-archived] [--format json|table|csv]

# Get a specific attribute
attio attribute get <target> <identifier> <attribute-slug> [--format json|table|csv]
```

**Examples:**

```bash
# List attributes for people object
attio attribute list objects people --format table

# Get specific attribute
attio attribute get objects companies industry --format json

# List attributes for a list
attio attribute list lists my_sales_pipeline --format table
```

#### Create & Update Attributes

```bash
# Create a new attribute
attio attribute create <target> <identifier> \
  --title "Attribute Title" \
  --slug attribute_slug \
  --type text|number|select|status|checkbox|date|... \
  [--description "..."] \
  [--required] \
  [--unique] \
  [--multiselect] \
  [--format json|table|csv]

# Update an attribute
attio attribute update <target> <identifier> <attribute-slug> \
  [--title "New Title"] \
  [--description "New description"] \
  [--required true|false] \
  [--unique true|false] \
  [--format json|table|csv]
```

**⚠️ Important**: Attributes **cannot be deleted** via the Attio API, only archived by updating their description.

**Examples:**

```bash
# Create a text attribute
attio attribute create objects people \
  --title "LinkedIn URL" \
  --slug linkedin_url \
  --type text

# Create a required select attribute
attio attribute create objects companies \
  --title "Industry" \
  --slug industry \
  --type select \
  --required

# Update attribute
attio attribute update objects companies industry \
  --title "Industry Sector" \
  --description "Primary industry classification"
```

#### Select Options Management

```bash
# List select options
attio attribute options <target> <identifier> <attribute-slug> [--show-archived] [--format json|table|csv]

# Create a select option
attio attribute option-create <target> <identifier> <attribute-slug> \
  --title "Option Title" \
  [--format json|table|csv]

# Update a select option
attio attribute option-update <target> <identifier> <attribute-slug> <option-id> \
  [--title "New Title"] \
  [--archived true|false] \
  [--format json|table|csv]

# Archive a select option
attio attribute option-archive <target> <identifier> <attribute-slug> <option-id>
```

**Examples:**

```bash
# Create industry select attribute with options
attio attribute create objects companies --title "Industry" --slug industry --type select

# Add options
attio attribute option-create objects companies industry --title "Technology"
attio attribute option-create objects companies industry --title "Healthcare"
attio attribute option-create objects companies industry --title "Finance"

# List all options
attio attribute options objects companies industry --format table

# Update an option
attio attribute option-update objects companies industry opt_xyz123 \
  --title "Technology & Software"

# Archive an option
attio attribute option-archive objects companies industry opt_old456
```

#### Status Management

```bash
# List statuses
attio attribute statuses <target> <identifier> <attribute-slug> [--show-archived] [--format json|table|csv]

# Create a status
attio attribute status-create <target> <identifier> <attribute-slug> \
  --title "Status Title" \
  [--celebration] \
  [--format json|table|csv]

# Update a status
attio attribute status-update <target> <identifier> <attribute-slug> <status-id> \
  [--title "New Title"] \
  [--celebration true|false] \
  [--archived true|false] \
  [--format json|table|csv]

# Archive a status
attio attribute status-archive <target> <identifier> <attribute-slug> <status-id>
```

**⚠️ Important**: Status attributes can **only be created on lists and custom objects**, not built-in objects like "people", "companies", or "deals".

**Examples:**

```bash
# Create status attribute on a list
attio attribute create lists sales_pipeline \
  --title "Deal Stage" \
  --slug deal_stage \
  --type status

# Add statuses
attio attribute status-create lists sales_pipeline deal_stage --title "Prospecting"
attio attribute status-create lists sales_pipeline deal_stage --title "Qualified"
attio attribute status-create lists sales_pipeline deal_stage --title "Proposal"
attio attribute status-create lists sales_pipeline deal_stage --title "Closed Won" --celebration

# List all statuses
attio attribute statuses lists sales_pipeline deal_stage --format table

# Update status
attio attribute status-update lists sales_pipeline deal_stage st_abc123 \
  --title "Qualified Lead" \
  --celebration false

# Archive status
attio attribute status-archive lists sales_pipeline deal_stage st_old789
```

---

### Records

Query, create, update, and delete records (people, companies, deals).

```bash
# List records with filtering and sorting
attio record list <object> \
  [--limit <n>] \
  [--offset <n>] \
  [--filter <json>] \
  [--sort <json>] \
  [--format json|table|csv]

# Get specific record
attio record get <object> <record-id> [--format json|table|csv]

# Create a new record
attio record create <object> --data <json> [--format json|table|csv]

# Update an existing record
attio record update <object> <record-id> --data <json> [--format json|table|csv]

# Replace all attribute values
attio record replace <object> <record-id> --data '<values-json>'

# Read or write one attribute's value history
attio record entries <object> <record-id> [--limit <n>] [--offset <n>]

attio record merge <object> --primary <record-id> --secondary <record-id>

attio record search --query "Ada" --objects people,companies [--as workspace|<member-id>|<email>]

attio record values <object> <record-id> <attribute> [--show-historic]
attio record set-values <object> <record-id> <attribute> --data '<json-array>' [--replace-history]

# Delete a record
attio record delete <object> <record-id>

# Assert (upsert) a record by matching attribute
attio record assert <object> \
  --matching-attribute <slug> \
  --data <json> \
  [--format json|table|csv]
```

**Examples:**

```bash
# List all people
attio record list people --limit 10 --format table

# Query people by name
attio record list people \
  --filter '{"name":{"first_name":{"$eq":"John"}}}' \
  --format json

# Query people by email contains
attio record list people \
  --filter '{"email_addresses":{"email_address":{"$contains":"@acme.com"}}}' \
  --format table

# Query with multiple conditions
attio record list people \
  --filter '{"$and":[{"name":{"first_name":{"$eq":"John"}}},{"name":{"last_name":{"$eq":"Smith"}}}]}' \
  --format json

# Sort results
attio record list companies \
  --sort '[{"attribute":"name","direction":"asc"}]' \
  --limit 20 \
  --format table

# Create a person
attio record create people --data '{
  "values": {
    "name": {
      "first_name": "Jane",
      "last_name": "Doe",
      "full_name": "Jane Doe"
    },
    "email_addresses": [{
      "email_address": "jane.doe@example.com",
      "is_primary": true
    }]
  }
}'

# Update a record
attio record update people rec_abc123 --data '{
  "values": {
    "name": {
      "first_name": "Janet",
      "last_name": "Doe",
      "full_name": "Janet Doe"
    }
  }
}'

# Upsert a person by email (creates if not exists, updates if exists)
attio record assert people \
  --matching-attribute email_addresses \
  --data '{
    "values": {
      "email_addresses": [{
        "email_address": "jane.doe@example.com"
      }],
      "name": {
        "first_name": "Jane",
        "last_name": "Doe"
      }
    }
  }'

# Delete a record
attio record delete people rec_abc123
```

---

### Lists

Manage lists and their configurations.

```bash
# List all lists
attio list list-all [--limit <n>] [--offset <n>] [--format json|table|csv]

# Get specific list
attio list get <list-slug> [--format json|table|csv]

# Create a list
attio list create \
  --api-slug list_slug \
  --name "List Name" \
  --parent-object people|companies|deals \
  [--workspace-access full-access|read-and-write|read-only] \
  [--format json|table|csv]

# Update a list
attio list update <list-slug> \
  [--name "New Name"] \
  [--workspace-access full-access|read-and-write|read-only] \
  [--format json|table|csv]

# List saved views
attio list views <list-slug> [--show-archived] [--limit <n>] [--cursor <cursor>]

# List attributes for a list
attio list attributes <list-slug> [--format json|table|csv]

# Get complete list schema with attribute values
attio list attributes-with-values <list-slug> [--show-archived] [--format json|table|csv]
```

**Examples:**

```bash
# List all lists
attio list list-all --format table

# Create a sales pipeline list
attio list create \
  --api-slug sales_pipeline \
  --name "Sales Pipeline" \
  --parent-object companies \
  --workspace-access full-access

# Get list details
attio list get sales_pipeline --format json

# Update list
attio list update sales_pipeline --name "Q1 Sales Pipeline"

# Export complete list schema
attio list attributes-with-values sales_pipeline --format json > pipeline-schema.json
```

---

### Entries

Manage list entries.

```bash
# List entries in a list
attio entry list <list-slug> \
  [--limit <n>] \
  [--offset <n>] \
  [--filter <json>] \
  [--sort <json>] \
  [--format json|table|csv]

# Get specific entry
attio entry get <list-slug> <entry-id> [--format json|table|csv]

# Create an entry
attio entry create <list-slug> \
  --parent-record <record-id> \
  --parent-object <object-slug> \
  --data <json> \
  [--format json|table|csv]

# Update an entry
attio entry update <list-slug> <entry-id> --data <json> [--format json|table|csv]

# Delete an entry
attio entry delete <list-slug> <entry-id>

# Assert (upsert) an entry
attio entry assert <list-slug> \
  --parent-record <record-id> \
  --parent-object <object-slug> \
  --data <json> \
  [--format json|table|csv]

# Replace an entry's values, or write one attribute's history
attio entry replace <list-slug> <entry-id> --data '<entry-values-json>'
attio entry set-values <list-slug> <entry-id> <attribute> --data '<json-array>' [--replace-history]
```

**Examples:**

```bash
# List all entries in sales pipeline
attio entry list sales_pipeline --format table

# Create an entry
attio entry create sales_pipeline \
  --parent-record rec_company123 \
  --parent-object companies \
  --data '{"entry_values":{"deal_stage":"qualified"}}'

# Update entry
attio entry update sales_pipeline ent_abc123 \
  --data '{"entry_values":{"deal_stage":"proposal"}}'

# Delete entry
attio entry delete sales_pipeline ent_abc123
```

---

### Notes

Manage notes linked to records.

```bash
# List notes for a record
attio note list <parent-object> <parent-record-id> \
  [--limit <n>] \
  [--offset <n>] \
  [--format json|table|csv]

# Get specific note
attio note get <note-id> [--format json|table|csv]

# Create a note
attio note create \
  --parent-object <object-slug> \
  --parent-record <record-id> \
  --title "Note Title" \
  --content "Note content" \
  [--format plaintext|markdown|html] \
  [--format-output json|table|csv]

# Update a note
attio note update <note-id> \
  [--title "New Title"] \
  [--content "New content"] \
  [--format plaintext|markdown|html] \
  [--format-output json|table|csv]

# Delete a note
attio note delete <note-id>
```

**Examples:**

```bash
# List notes for a person
attio note list people rec_person123 --format table

# Create a note
attio note create \
  --parent-object people \
  --parent-record rec_person123 \
  --title "Meeting Notes" \
  --content "Discussed Q1 objectives" \
  --format markdown

# Update note
attio note update note_abc123 \
  --title "Q1 Meeting Notes" \
  --content "# Q1 Objectives\n- Revenue goals\n- Product roadmap"

# Delete note
attio note delete note_abc123
```

---

### Tasks

Manage tasks linked to records.

```bash
# List tasks for a record
attio task list <parent-object> <parent-record-id> \
  [--limit <n>] \
  [--offset <n>] \
  [--format json|table|csv]

# Get specific task
attio task get <task-id> [--format json|table|csv]

# Create a task
attio task create \
  --content "Task description" \
  [--deadline <iso8601-date>] \
  [--assignee <workspace-member-id>] \
  [--linked-record <record-id>] \
  [--format json|table|csv]

# Update a task
attio task update <task-id> \
  [--content "Updated description"] \
  [--completed true|false] \
  [--deadline <iso8601-date>] \
  [--format json|table|csv]

# Delete a task
attio task delete <task-id>
```

**Examples:**

```bash
# List all tasks for a person
attio task list people rec_person123 --format table

# Create a task
attio task create \
  --content "Follow up on proposal" \
  --deadline "2024-03-15T10:00:00Z" \
  --assignee wm_member123 \
  --linked-record rec_company456

# Mark task as completed
attio task update task_abc123 --completed true

# Update deadline
attio task update task_abc123 --deadline "2024-03-20T10:00:00Z"

# Delete task
attio task delete task_abc123
```

---

### Meetings

View and manage meetings.

```bash
# List meetings
attio meeting list \
  [--limit <n>] \
  [--cursor <cursor>] \
  [--sort start_asc|start_desc] \
  [--linked-object <slug>] \
  [--linked-record-id <id>] \
  [--participants <emails>] \
  [--format json|table|csv]

# Get specific meeting
attio meeting get <meeting-id> [--format json|table|csv]

# Create a meeting
attio meeting create --title "Kickoff" --description "Agenda" \
  --start 2026-10-01T15:00:00Z --end 2026-10-01T15:30:00Z

# Link records, replace links, or delete
attio meeting link <meeting-id> --linked-records '[{"object":"people","record_id":"<uuid>"}]'
attio meeting set-links <meeting-id> --linked-records '[]'
attio meeting delete <meeting-id>
```

### Comments

```bash
attio comment create --content "Following up" --author-id <member-id> \
  --record-object people --record-id <record-id>
attio comment get <comment-id>
attio comment delete <comment-id>
```
```

**Examples:**

```bash
# List meetings linked to a person
attio meeting list --linked-object people --linked-record-id rec_person123 --format table

# Get meeting details
attio meeting get meeting_abc123 --format json

# Export meetings to CSV
attio meeting list --format csv > meetings.csv
```

---

## Output Formats

All commands support three output formats:

### JSON (Default)

Pretty-printed JSON for programmatic use:

```bash
attio workspace members list --format json
```

### Table

Human-readable ASCII table:

```bash
attio workspace members list --format table
```

### CSV

CSV format for spreadsheet import:

```bash
attio workspace members list --format csv > members.csv
```

---

## Compact Output Formatting

By default, record and entry outputs use **compact formatting** for better readability. This removes API metadata and extracts essential values based on attribute types.

### Default Behavior

When listing or getting records/entries, the CLI automatically:

1. **Removes metadata**: Hides `active_from`, `active_until`, `created_by_actor`, `attribute_type`
2. **Filters test attributes**: Hides attributes starting with `test_`
3. **Extracts values**: Shows only the essential data based on attribute type
4. **Simplifies structure**: Single values are unwrapped from arrays, empty attributes show as `null`

### Verbose Mode

Use the `--verbose` flag to see the full API response with all metadata:

```bash
# Compact output (default)
attio record get people rec_abc123 --format json

# Full API response with metadata
attio record get people rec_abc123 --format json --verbose
```

### Example Output Comparison

**Verbose output** (with `--verbose`):

```json
{
  "values": {
    "name": [
      {
        "active_from": "2026-01-30T18:33:54.442000000Z",
        "active_until": null,
        "created_by_actor": {"type": "api-token", "id": "..."},
        "first_name": "Michael",
        "last_name": "Fröhlich",
        "full_name": "Michael Fröhlich",
        "attribute_type": "personal-name"
      }
    ],
    "email_addresses": [
      {
        "active_from": "2026-01-30T18:33:54.442000000Z",
        "active_until": null,
        "created_by_actor": {"type": "workspace-member", "id": "..."},
        "email_address": "m.froehlich1994@gmail.com",
        "email_domain": "gmail.com",
        "attribute_type": "email-address"
      }
    ],
    "twitter": [
      {
        "active_from": "2026-01-15T14:43:24.827000000Z",
        "active_until": null,
        "created_by_actor": {"type": "workspace-member", "id": "..."},
        "value": "https://x.com/froehlichmmm",
        "attribute_type": "text"
      }
    ],
    "instagram": [],
    "test_attr_1770130545682": []
  }
}
```

**Compact output** (default):

```json
{
  "values": {
    "name": "Michael Fröhlich",
    "email_addresses": ["m.froehlich1994@gmail.com"],
    "twitter": "https://x.com/froehlichmmm",
    "instagram": null
  }
}
```

### Attribute Type Extraction

The CLI automatically extracts the essential data based on attribute type:

| Attribute Type | Extraction Logic | Example |
|---------------|------------------|---------|
| `text`, `number`, `checkbox`, `date` | `.value` | `"John Doe"`, `42`, `true` |
| `personal-name` | `.full_name` or constructed | `"John Doe"` |
| `email-address` | `.email_address` | `"user@example.com"` |
| `phone-number` | `.phone_number` | `"+1234567890"` |
| `location` | Formatted string | `"Munich, Bavaria, DE"` |
| `select`, `multiselect` | `.option.title` | `"CDTM"`, `["Tag1", "Tag2"]` |
| `status` | `.status.title` | `"Active"` |
| `record-reference` | `.target_record_id` | `"rec_abc123"` |
| `actor-reference` | `.referenced_actor_type` | `"workspace-member"` |

### Commands with Compact Formatting

Compact formatting is available for these commands (add `--verbose` to disable):

**Records:**
- `attio record list <object> [--verbose]`
- `attio record get <object> <record-id> [--verbose]`
- `attio record create <object> --data <json> [--verbose]`
- `attio record update <object> <record-id> --data <json> [--verbose]`
- `attio record assert <object> --matching-attribute <slug> --data <json> [--verbose]`

**Entries:**
- `attio entry list <list-slug> [--verbose]`
- `attio entry get <list-slug> <entry-id> [--verbose]`
- `attio entry create <list-slug> --parent-record-id <id> --parent-object <object> --data <json> [--verbose]`
- `attio entry update <list-slug> <entry-id> --data <json> [--verbose]`
- `attio entry assert <list-slug> --data <json> [--verbose]`

---

## Filtering & Sorting

### Filter Syntax

Use JSON-based filter queries with the `--filter` option:

#### Basic Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Exact match | `{"name":{"first_name":{"$eq":"John"}}}` |
| `$ne` | Not equal | `{"status":{"$ne":"archived"}}` |
| `$contains` | Contains substring | `{"email":{"$contains":"@acme.com"}}` |
| `$starts_with` | Starts with | `{"name":{"$starts_with":"J"}}` |
| `$ends_with` | Ends with | `{"email":{"$ends_with":".com"}}` |
| `$gt` / `$gte` | Greater than (or equal) | `{"created_at":{"$gt":"2024-01-01"}}` |
| `$lt` / `$lte` | Less than (or equal) | `{"amount":{"$lte":1000}}` |

#### Logical Operators

```bash
# AND condition
--filter '{"$and":[{"name":{"first_name":{"$eq":"John"}}},{"name":{"last_name":{"$eq":"Smith"}}}]}'

# OR condition
--filter '{"$or":[{"status":{"$eq":"active"}},{"status":{"$eq":"pending"}}]}'
```

#### Examples

```bash
# Find people named John
attio record list people \
  --filter '{"name":{"first_name":{"$eq":"John"}}}'

# Find companies with emails ending in .com
attio record list companies \
  --filter '{"email_addresses":{"email_address":{"$ends_with":".com"}}}'

# Find people with multiple conditions
attio record list people \
  --filter '{"$and":[
    {"name":{"last_name":{"$eq":"Smith"}}},
    {"email_addresses":{"email_address":{"$contains":"@acme.com"}}}
  ]}'
```

### Sort Syntax

Use JSON arrays with the `--sort` option:

```bash
# Sort by name ascending
attio record list people \
  --sort '[{"attribute":"name","direction":"asc"}]'

# Sort by multiple fields
attio record list companies \
  --sort '[
    {"attribute":"created_at","direction":"desc"},
    {"attribute":"name","direction":"asc"}
  ]'
```

---

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/ekrtf/attio-cli.git
cd attio-cli

# Install dependencies
npm install

# Build
npm run build

# Run in development mode (with auto-reload)
npm run dev -- workspace members list
```

### Project Structure

```
attio-cli/
├── src/
│   ├── api/
│   │   ├── client.ts          # Axios HTTP client with retry logic
│   │   ├── errors.ts          # Error handling and types
│   │   ├── types.ts           # Zod schemas and TypeScript types
│   │   └── endpoints/         # API endpoint classes
│   │       ├── attributes.ts
│   │       ├── objects.ts
│   │       ├── records.ts
│   │       ├── lists.ts
│   │       ├── entries.ts
│   │       ├── notes.ts
│   │       ├── tasks.ts
│   │       └── meetings.ts
│   ├── commands/              # CLI command definitions
│   │   ├── workspace.ts
│   │   ├── object.ts
│   │   ├── attribute.ts
│   │   ├── record.ts
│   │   ├── list.ts
│   │   ├── entry.ts
│   │   ├── note.ts
│   │   ├── task.ts
│   │   └── meeting.ts
│   ├── formatters/            # Output formatters
│   │   ├── json.ts
│   │   ├── table.ts
│   │   └── csv.ts
│   ├── utils/                 # Utility functions
│   │   ├── validation.ts
│   │   └── filter-validator.ts
│   └── cli.ts                 # CLI entry point
├── tests/
│   └── integration/           # Integration tests against live API
├── dist/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Tech Stack

- **[TypeScript](https://www.typescriptlang.org/)** - Strict mode with full type safety
- **[Commander.js](https://github.com/tj/commander.js)** - CLI framework
- **[Axios](https://axios-http.com/)** - HTTP client with interceptors
- **[Zod](https://github.com/colinhacks/zod)** - Runtime type validation
- **[Vitest](https://vitest.dev/)** - Fast unit and integration testing
- **[cli-table3](https://github.com/cli-table/cli-table3)** - ASCII table rendering
- **[csv-stringify](https://csv.js.org/stringify/)** - CSV generation

### Scripts

```bash
# Development
npm run dev              # Run CLI in development mode
npm run build            # Compile TypeScript to JavaScript
npm run type-check       # Type check without emitting files

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run check:api        # Compare the CLI with the live Attio OpenAPI spec

# Testing
npm test                 # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:integration # Run integration tests (requires API key)
```

---

## Testing

### Unit Tests

Run fast unit tests without external dependencies:

```bash
npm test
```

### Integration Tests

Integration tests run against the live Attio API and require a valid API key:

```bash
# Set your API key
export ATTIO_API_KEY="attio_sk_your_key_here"

# Run all integration tests
npm run test:integration

# Run specific test suite
npm run test:integration tests/integration/attributes.test.ts

# Run with verbose output
npm run test:integration -- --reporter=verbose
```

**⚠️ Warning**: Integration tests will create, modify, and delete data in your Attio workspace. Use a development/test workspace.

### Test Coverage

The project includes **112 integration tests** covering:

- ✅ Workspace members (11 tests)
- ✅ Objects and attributes (6 tests)
- ✅ Attribute management (11 tests)
- ✅ Convenience commands (9 tests)
- ✅ Records CRUD (16 tests)
- ✅ Lists CRUD (11 tests)
- ✅ List entries (16 tests)
- ✅ Notes CRUD (10 tests)
- ✅ Tasks CRUD (11 tests)
- ✅ Meetings read-only (7 tests)
- ✅ API client (11 tests)

### Writing Tests

Integration tests follow this pattern:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AttioClient } from '../../src/api/client';
import { RecordEndpoints } from '../../src/api/endpoints/records';

describe('Records Integration Tests', () => {
  let client: AttioClient;
  let recordApi: RecordEndpoints;
  let testRecordId: string | null = null;

  beforeAll(() => {
    if (!process.env.ATTIO_API_KEY) {
      throw new Error('ATTIO_API_KEY not found');
    }
    client = new AttioClient();
    recordApi = new RecordEndpoints(client);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testRecordId) {
      await recordApi.deleteRecord('people', testRecordId);
    }
  });

  it('should create a record', async () => {
    const record = await recordApi.createRecord('people', {
      data: { values: { /* ... */ } }
    });
    expect(record).toBeDefined();
    testRecordId = record.id.record_id;
  });
});
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/ekrtf/attio-cli.git`
3. **Create a branch**: `git checkout -b feature/my-feature`
4. **Make changes** and add tests
5. **Run tests**: `npm test && npm run test:integration`
6. **Lint and format**: `npm run lint:fix && npm run format`
7. **Commit** with a clear message: `git commit -m "Add feature: ..."`
8. **Push**: `git push origin feature/my-feature`
9. **Create a Pull Request**

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions small and focused

### Commit Messages

Follow conventional commits:

```
feat: Add support for custom fields
fix: Handle rate limit errors correctly
docs: Update README with new examples
test: Add integration tests for lists
refactor: Simplify filter validation logic
```

### Testing Requirements

- All new features must include tests
- Integration tests for API endpoints
- Maintain >90% test coverage
- Tests must clean up after themselves

---

## Troubleshooting

### Common Issues

**API Key Not Found**

```
Error: ATTIO_API_KEY not found in environment
```

Solution: Set your API key in `.env` or export it:
```bash
export ATTIO_API_KEY="attio_sk_your_key_here"
```

**Rate Limit Errors**

```
Error: Rate limit exceeded
```

Solution: The CLI automatically retries with exponential backoff. Reduce request frequency or upgrade your Attio plan.

**Invalid Filter Syntax**

```
Error: Invalid filter structure
```

Solution: Check filter JSON syntax and use valid operators:
```bash
attio record list people --filter '{"name":{"first_name":{"$eq":"John"}}}'
```

**404 Errors**

```
Error: Could not find endpoint
```

Solution: Verify the object/record/list slug exists. Some operations (like status attributes) only work on lists/custom objects.

---

## API Limitations

### Known Restrictions

| Operation | Limitation | Workaround |
|-----------|-----------|------------|
| Delete attributes | ❌ Not supported | Archive by updating description |
| Status attributes | ⚠️ Lists/custom objects only | Use select attributes for built-in objects |
| Delete options/statuses | ⚠️ May not be reliable | Use archive commands instead |

For more details, see [ATTRIBUTE_MANAGEMENT.md](./ATTRIBUTE_MANAGEMENT.md).

---

## Roadmap

- [ ] Webhook management
- [ ] Bulk import/export operations
- [ ] Interactive mode with prompts
- [ ] Workspace configuration commands
- [ ] Custom field type support
- [ ] Advanced query builder
- [ ] Performance optimizations

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/ekrtf/attio-cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ekrtf/attio-cli/discussions)
- **Attio Support**: support@attio.com

---

## Related Resources

- [Attio API Documentation](https://developers.attio.com/)
- [Attio Help Center](https://help.attio.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Commander.js Documentation](https://github.com/tj/commander.js)

---

**Built with ❤️ by the community**
