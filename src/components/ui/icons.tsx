import {
  Accessibility, Activity, Antenna, Archive, ArchiveRestore, Award, Badge, BadgeCheck, Ban, Banknote, Battery, BatteryCharging,
  Bell, Biohazard, Blocks, Bluetooth, Bomb, Book, BookOpen, Bot, Box, Boxes, Brain, Braces, Briefcase, Bug, Building, Building2, Cable,
  Calculator, Calendar, CalendarClock, Camera, Car, Cctv, CircleAlert, CircleCheck, CircleQuestionMark, CircleX, CircuitBoard,
  Clipboard, ClipboardCheck, ClipboardList, Clock, Cloud, CloudCog, Code, Cog, Coins, Compass, Construction, Contact, Container,
  Cpu, CreditCard, Crosshair, Crown, Database, DatabaseBackup, Dices, DoorClosed, DoorOpen, Droplets, Earth, EthernetPort, Eye,
  EyeOff, Factory, Fence, File, FileCheck, FileCode, FileExclamationPoint, FileKey, FileLock, FileSearch, FileText, FileX,
  FingerprintPattern, Fish, Flag, Flame, Folder, FolderLock, Footprints, Funnel, Gauge, Gavel, Ghost, GitBranch, Globe, GraduationCap,
  Hammer, Hand, Handshake, HardDrive, Hash, Headset, HeartPulse, History, Hourglass, House, IdCard, Image, Inbox, Key, KeyRound,
  Lamp, Landmark, Layers, Library, Lightbulb, Link, ListChecks, ListOrdered, Lock, LockKeyhole, LockOpen, Magnet, Mail, MailCheck,
  MailWarning, Map, MapPin, Megaphone, MessageSquare, MessageSquareWarning, Mic, Microchip, Monitor, Network, Newspaper, OctagonAlert,
  Package, PackageCheck, PersonStanding, Phone, PhoneCall, Plug, Power, Printer, Puzzle, QrCode, Radar, Radio, RadioTower, Rat,
  Recycle, RefreshCw, Repeat, Rocket, RotateCcw, Route, Router, Satellite, Scale, Scan, ScanFace, ScanSearch, School, Scroll,
  ScrollText, Search, Send, Server, ServerCog, Settings, Shield, ShieldAlert, ShieldCheck, ShieldHalf, ShieldOff, ShieldPlus, ShieldX,
  Shredder, Shuffle, Signature, Siren, Skull, SlidersHorizontal, Smartphone, Snowflake, Sparkles, Split, SquareTerminal, Stamp, Star,
  Sun, Swords, Tablet, Tag, Target, Telescope, Terminal, Thermometer, Ticket, Timer, ToggleRight, Trash2, TrendingDown, TrendingUp,
  TriangleAlert, Trophy, Truck, Umbrella, Unlink, Unplug, Usb, User, UserCheck, UserCog, UserRound, UserSearch, UserX, Users, Vault,
  Upload, Download, Video, Voicemail, Wallet, Warehouse, Waypoints, Webhook, Weight, Wifi, WifiOff, Wind, Workflow, Worm, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react';

/** Icons that content files can reference by name (keeps content as plain data). */
export const ICONS: Record<string, LucideIcon> = {
  accessibility: Accessibility, activity: Activity, antenna: Antenna, archive: Archive, restore: ArchiveRestore, award: Award,
  badge: Badge, 'badge-check': BadgeCheck, ban: Ban, bell: Bell, money: Banknote, battery: Battery, charging: BatteryCharging, biohazard: Biohazard,
  blocks: Blocks, bluetooth: Bluetooth, bomb: Bomb, book: Book, 'book-open': BookOpen, bot: Bot, box: Box, boxes: Boxes, brain: Brain,
  braces: Braces, briefcase: Briefcase, bug: Bug, building: Building, office: Building2, cable: Cable, calculator: Calculator,
  calendar: Calendar, schedule: CalendarClock, camera: Camera, car: Car, cctv: Cctv, alert: CircleAlert, ok: CircleCheck,
  question: CircleQuestionMark, fail: CircleX, circuit: CircuitBoard, clipboard: Clipboard, 'clipboard-check': ClipboardCheck,
  checklist: ClipboardList, clock: Clock, cloud: Cloud, 'cloud-cog': CloudCog, code: Code, cog: Cog, coins: Coins, compass: Compass,
  construction: Construction, contact: Contact, container: Container, cpu: Cpu, card: CreditCard, crosshair: Crosshair, crown: Crown,
  database: Database, backup: DatabaseBackup, dice: Dices, 'door-closed': DoorClosed, door: DoorOpen, droplets: Droplets, earth: Earth,
  ethernet: EthernetPort, eye: Eye, 'eye-off': EyeOff, factory: Factory, fence: Fence, file: File, 'file-check': FileCheck,
  'file-code': FileCode, 'file-alert': FileExclamationPoint, 'file-key': FileKey, 'file-lock': FileLock, 'file-search': FileSearch,
  'file-text': FileText, 'file-x': FileX, fingerprint: FingerprintPattern, fish: Fish, flag: Flag, flame: Flame, folder: Folder,
  'folder-lock': FolderLock, footprints: Footprints, filter: Funnel, gauge: Gauge, gavel: Gavel, ghost: Ghost, branch: GitBranch,
  globe: Globe, cap: GraduationCap, hammer: Hammer, hand: Hand, handshake: Handshake, disk: HardDrive, hash: Hash, headset: Headset,
  heart: HeartPulse, history: History, hourglass: Hourglass, home: House, 'id-card': IdCard, image: Image, inbox: Inbox, key: Key,
  'key-round': KeyRound, lamp: Lamp, landmark: Landmark, layers: Layers, library: Library, bulb: Lightbulb, link: Link,
  'list-checks': ListChecks, 'list-ordered': ListOrdered, lock: Lock, keyhole: LockKeyhole, unlock: LockOpen, magnet: Magnet,
  mail: Mail, 'mail-check': MailCheck, 'mail-warning': MailWarning, map: Map, pin: MapPin, megaphone: Megaphone, message: MessageSquare,
  'message-warning': MessageSquareWarning, mic: Mic, chip: Microchip, monitor: Monitor, network: Network, news: Newspaper,
  octagon: OctagonAlert, package: Package, 'package-check': PackageCheck, person: PersonStanding, phone: Phone, call: PhoneCall,
  plug: Plug, power: Power, printer: Printer, puzzle: Puzzle, qr: QrCode, radar: Radar, radio: Radio, tower: RadioTower, rat: Rat,
  recycle: Recycle, refresh: RefreshCw, repeat: Repeat, rocket: Rocket, undo: RotateCcw, route: Route, router: Router,
  satellite: Satellite, scale: Scale, scan: Scan, face: ScanFace, 'scan-search': ScanSearch, school: School, scroll: Scroll,
  policy: ScrollText, search: Search, send: Send, server: Server, 'server-cog': ServerCog, settings: Settings, shield: Shield,
  'shield-alert': ShieldAlert, 'shield-check': ShieldCheck, 'shield-half': ShieldHalf, 'shield-off': ShieldOff, 'shield-plus': ShieldPlus,
  'shield-x': ShieldX, shredder: Shredder, shuffle: Shuffle, signature: Signature, siren: Siren, skull: Skull, sliders: SlidersHorizontal,
  phone2: Smartphone, mobile: Smartphone, snowflake: Snowflake, sparkles: Sparkles, split: Split, terminal: SquareTerminal, stamp: Stamp,
  star: Star, sun: Sun, swords: Swords, tablet: Tablet, tag: Tag, target: Target, telescope: Telescope, shell: Terminal,
  thermometer: Thermometer, ticket: Ticket, timer: Timer, toggle: ToggleRight, trash: Trash2, 'trend-down': TrendingDown,
  'trend-up': TrendingUp, warn: TriangleAlert, trophy: Trophy, truck: Truck, umbrella: Umbrella, unlink: Unlink, unplug: Unplug,
  usb: Usb, user: User, 'user-check': UserCheck, 'user-cog': UserCog, 'user-round': UserRound, 'user-search': UserSearch, 'user-x': UserX,
  users: Users, vault: Vault, video: Video, voicemail: Voicemail, wallet: Wallet, warehouse: Warehouse, waypoints: Waypoints,
  upload: Upload, download: Download, webhook: Webhook, weight: Weight, wifi: Wifi, 'wifi-off': WifiOff, wind: Wind, workflow: Workflow, worm: Worm, wrench: Wrench, zap: Zap,
  // semantic aliases used by diagrams
  firewall: ShieldHalf, switch: Network, ap: Wifi, cert: BadgeCheck, ca: Landmark, attacker: Skull, laptop: Monitor, internet: Globe,
  honeypot: Magnet, sensor: Radar, ids: Eye, ips: ShieldX, waf: ShieldCheck, proxy: Split, vpn: KeyRound, siem: Activity,
};

export function iconFor(name: string | undefined): LucideIcon {
  return (name && ICONS[name]) || Shield;
}

export function Icon({ name, className, strokeWidth }: { name?: string; className?: string; strokeWidth?: number }) {
  const C = iconFor(name);
  return <C className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
