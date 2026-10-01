import {
  BookOpen,
  Cake,
  GraduationCap,
  Heart,
  MapPin,
  OctagonAlert,
  Pill,
  ShieldCheck,
  Stethoscope,
  TestTube,
  TriangleAlert,
  Users,
} from 'lucide-react'

export const FIELD_ICONS = {
  age: Cake,
  marital: Users,
  education: GraduationCap,
  orientation: Heart,
  place: MapPin,
  std: Stethoscope,
  tested_past_year: TestTube,
  aids_education: BookOpen,
  drugs: Pill,
}

export const LEVEL_ICONS = {
  low: ShieldCheck,
  medium: TriangleAlert,
  high: OctagonAlert,
}
