import { BaseResource, JsonAttribute, JsonResource } from '@vmelou/jsonapi';

export type CedCategory = 'A' | 'B' | 'C';

@JsonResource('CEDCode')
export class CedCode extends BaseResource {
  @JsonAttribute()
  code!: string;

  @JsonAttribute()
  chapterCode!: string;

  @JsonAttribute()
  subCategoryCode!: string | null;

  @JsonAttribute()
  subCategoryLabel!: string | null;

  @JsonAttribute()
  label!: string;

  @JsonAttribute()
  isHazardous!: boolean;

  @JsonAttribute()
  category!: CedCategory;

  @JsonAttribute()
  subCategoryA!: string | null;

  @JsonAttribute()
  subCategoryALabel!: string | null;

  @JsonAttribute()
  allowedUnits!: string[] | null;

  @JsonAttribute()
  pointsPerUnit!: string | null;

  @JsonAttribute()
  referenceScenario!: string | null;

  @JsonAttribute()
  isActive!: boolean;

  @JsonAttribute()
  created!: string;

  @JsonAttribute()
  modified!: string;

  get categoryLabel(): string {
    return (
      (
        {
          A: $localize`:@@cedCode.category.a:Category A`,
          B: $localize`:@@cedCode.category.b:Category B`,
          C: $localize`:@@cedCode.category.c:Category C`,
        } as Record<string, string>
      )[this.category] ?? this.category
    );
  }

  get categoryVariant(): 'default' | 'secondary' | 'outline' {
    return (
      (
        {
          A: 'default',
          B: 'secondary',
          C: 'outline',
        } as Record<string, 'default' | 'secondary' | 'outline'>
      )[this.category] ?? 'outline'
    );
  }

  constructor(data?: Partial<CedCode>) {
    super(data);
    Object.assign(this, data);
  }
}
