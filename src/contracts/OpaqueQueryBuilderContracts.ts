import { ModelAttributes, OpaqueAttributes, OpaqueTable } from "@opaquejs/opaque/lib/contracts/ModelContracts";
import { QueryBuilderInterface } from "@opaquejs/opaque/lib/contracts/QueryBuilderInterface";
import { ComparisonTypes, NormalizedQuery } from "@opaquejs/query";

export type OpaqueQueryBuilderModifier<QueryBuilder extends OpaqueQueryBuilderContract<any>> = (
  query: QueryBuilder
) => QueryBuilder;

export interface OpaqueQueryBuilderConstructorContract {
  new <Model extends OpaqueTable>(model: Model, $query: NormalizedQuery): OpaqueQueryBuilderContract<Model>;
}

export interface OpaqueQueryBuilderContract<Model extends OpaqueTable> extends QueryBuilderInterface<NormalizedQuery> {
  // Needed for interface
  $getQuery(): NormalizedQuery;

  // Querying
  where<
    Attributes extends ModelAttributes<InstanceType<Model>>,
    Attribute extends keyof Attributes,
    Key extends keyof ComparisonTypes<any>
  >(
    attribute: Attribute,
    operator: Key,
    value: ComparisonTypes<Attributes[Attribute]>[Key]
  ): this;
  where<Attributes extends ModelAttributes<InstanceType<Model>>, Attribute extends keyof Attributes>(
    attribute: Attribute,
    value: ComparisonTypes<Attributes[Attribute]>["=="]
  ): this;
  andWhere: this["where"];
  orWhere: this["where"];
  or(modifier: OpaqueQueryBuilderModifier<this>): this;
  and(modifier: OpaqueQueryBuilderModifier<this>): this;

  limit(limit: number): this;
  skip(skip: number): this;
  orderBy(key: keyof ModelAttributes<InstanceType<Model>>, direction?: "asc" | "desc"): this;

  get(): Promise<InstanceType<Model>[]>;
  first(): Promise<InstanceType<Model>>;

  update(data: OpaqueAttributes): Promise<void>;
  delete(data: OpaqueAttributes): Promise<void>;
}
